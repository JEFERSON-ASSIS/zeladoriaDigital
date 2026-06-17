import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { AlertLevel, OccurrenceStatus, PriorityLevel, Prisma, UserRole } from '@prisma/client';
import { PriorityService } from '../priority/priority.service';
import { ServiceAreaService } from '../service-area/service-area.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AccessScopeService } from '../access/access-scope.service';
import { resolveAttachmentType } from './attachment.utils';

@Injectable()
export class OccurrencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priorityService: PriorityService,
    private readonly serviceAreaService: ServiceAreaService,
    private readonly accessScope: AccessScopeService,
    private readonly whatsappService: WhatsAppService
  ) {}

  private occurrenceInclude = {
    category: true,
    citizen: true,
    neighborhood: true,
    suggestedDepartment: true,
    serviceOrders: {
      include: {
        department: true,
        fieldTeam: true
      }
    },
    movements: {
      orderBy: { createdAt: 'desc' as const }
    },
    attachments: {
      orderBy: { createdAt: 'asc' as const }
    }
  };

  private async buildScopeForUser(user: { sub: string; role: UserRole }) {
    return this.accessScope.occurrenceScopeForUser(user);
  }

  async findAllForUser(user: { sub: string; role: UserRole }) {
    const where = await this.buildScopeForUser(user);
    return this.prisma.occurrence.findMany({
      where,
      include: this.occurrenceInclude,
      orderBy: { createdAt: 'desc' }
    });
  }

  findAll() {
    return this.prisma.occurrence.findMany({
      include: this.occurrenceInclude,
      orderBy: { createdAt: 'desc' }
    });
  }

  findByCitizen(citizenId: string) {
    return this.prisma.occurrence.findMany({
      where: { citizenId },
      include: this.occurrenceInclude,
      orderBy: { createdAt: 'desc' }
    });
  }

  findByProtocol(protocol: string) {
    return this.prisma.occurrence.findUnique({
      where: { protocol },
      include: {
        category: true,
        citizen: true,
        neighborhood: true,
        serviceOrders: {
          include: {
            department: true,
            fieldTeam: true
          }
        },
        movements: {
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async addAttachment(
    occurrenceId: string,
    file: Express.Multer.File,
    user: { sub: string; role: UserRole }
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const fileType = resolveAttachmentType(file.mimetype);
    if (!fileType) {
      throw new BadRequestException('Envie apenas fotos (JPEG, PNG, WebP) ou áudio (WebM, MP3, WAV).');
    }

    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id: occurrenceId },
      select: { id: true, citizenId: true }
    });
    if (!occurrence) {
      throw new NotFoundException('Ocorrência não encontrada.');
    }

    if (user.role === UserRole.CIDADAO && occurrence.citizenId !== user.sub) {
      throw new ForbiddenException('Você só pode anexar arquivos nas suas próprias solicitações.');
    }

    const fileUrl = `/uploads/occurrences/${occurrenceId}/${file.filename}`;

    return this.prisma.occurrenceAttachment.create({
      data: {
        occurrenceId,
        fileUrl,
        fileType
      }
    });
  }

  async create(data: CreateOccurrenceDto) {
    const normalizedStatus = (data.status ?? OccurrenceStatus.ABERTO) as OccurrenceStatus;
    const coordinates = await this.resolveCoordinates(data);
    const address = data.address?.trim()
      || (coordinates.latitude != null && coordinates.longitude != null
        ? 'Localização enviada pelo celular'
        : '');

    if (!address && coordinates.latitude == null) {
      throw new BadRequestException('Informe o endereço ou compartilhe sua localização.');
    }

    const areaValidation = await this.serviceAreaService.validate({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });
    if (!areaValidation.valid && areaValidation.blocked) {
      throw new BadRequestException(areaValidation.reason ?? 'Ocorrência fora da área atendida.');
    }

    const [category, departments] = await Promise.all([
      data.categoryId ? this.prisma.category.findUnique({ where: { id: data.categoryId } }) : Promise.resolve(null),
      this.prisma.department.findMany({ select: { id: true, name: true, municipalityId: true, createdAt: true, updatedAt: true } })
    ]);
    const priorityResult = this.priorityService.calculatePriority({
      title: data.title,
      description: data.description,
      category,
      address
    });
    const duplicate = await this.priorityService.detectPossibleDuplicate(
      { title: data.title, description: data.description },
      await this.prisma.occurrence.findMany({
        select: { id: true, title: true, description: true, address: true },
        take: 25,
        orderBy: { createdAt: 'desc' }
      })
    );
    const suggestedDepartment = this.priorityService.suggestDepartment(
      { title: data.title, description: data.description, category },
      departments
    );
    if (!data.suggestedDepartmentId && !suggestedDepartment?.id) {
      throw new BadRequestException('Selecione a secretaria responsável pela solicitação.');
    }

    const targetDepartmentId = data.suggestedDepartmentId ?? suggestedDepartment?.id;
    const targetDepartment = targetDepartmentId
      ? departments.find((item) => item.id === targetDepartmentId)
      : null;
    if (targetDepartmentId && !targetDepartment) {
      throw new BadRequestException('Secretaria selecionada não existe.');
    }
    const initialStatus = targetDepartmentId
      ? OccurrenceStatus.ENCAMINHADO
      : normalizedStatus;

    const occurrence = await this.prisma.occurrence.create({
      data: {
        ...data,
        address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        status: initialStatus,
        priority: (data.priority ?? priorityResult.level) as PriorityLevel,
        priorityScore: priorityResult.score,
        duplicateGroupId: duplicate ? duplicate.id : undefined,
        suggestedDepartmentId: targetDepartmentId,
        protocol: `OC-${Date.now()}`
      } as any
    });

    await this.prisma.occurrenceMovement.create({
      data: {
        occurrenceId: occurrence.id,
        fromStatus: null,
        toStatus: initialStatus,
        note: targetDepartment
          ? `Solicitação encaminhada para ${targetDepartment.name}.`
          : 'Ocorrência criada.'
      }
    });

    if (targetDepartmentId) {
      await this.ensureServiceOrder(occurrence.id, initialStatus);
    }

    if (!areaValidation.valid) {
      await this.prisma.managerialAlert.create({
        data: {
          type: 'OUTSIDE_SERVICE_AREA',
          title: `Ocorrência fora da área: ${occurrence.protocol}`,
          message: areaValidation.reason ?? 'A ocorrência foi marcada fora da área atendida.',
          level: AlertLevel.WARNING,
          occurrenceId: occurrence.id
        }
      });
    }

    await this.prisma.occurrenceMovement.create({
      data: {
        occurrenceId: occurrence.id,
        fromStatus: null,
        toStatus: normalizedStatus,
        note: 'Ocorrência criada.'
      }
    });

    await this.whatsappService.sendProtocolCreated({
      protocol: occurrence.protocol
    });

    return this.prisma.occurrence.findUnique({
      where: { id: occurrence.id },
      include: this.occurrenceInclude
    });
  }

  async update(id: string, data: UpdateOccurrenceDto, user?: { sub: string; role: UserRole }) {
    if (user) {
      await this.accessScope.assertOccurrenceAccess(user, id);
    }
    const current = await this.prisma.occurrence.findUnique({ where: { id } });
    if (!current) {
      throw new BadRequestException('Ocorrência não encontrada.');
    }

    const payload: Record<string, unknown> = { ...data };
    for (const key of ['categoryId', 'neighborhoodId', 'suggestedDepartmentId', 'citizenId', 'municipalityId'] as const) {
      if (payload[key] === '' || payload[key] === null) {
        delete payload[key];
      }
    }

    if (typeof payload.suggestedDepartmentId === 'string') {
      const department = await this.prisma.department.findUnique({
        where: { id: payload.suggestedDepartmentId }
      });
      if (!department) {
        throw new BadRequestException('Secretaria selecionada não existe.');
      }
    }

    if (typeof payload.categoryId === 'string') {
      const category = await this.prisma.category.findUnique({
        where: { id: payload.categoryId }
      });
      if (!category) {
        throw new BadRequestException('Categoria selecionada não existe.');
      }
    }

    if (typeof payload.neighborhoodId === 'string') {
      const neighborhood = await this.prisma.neighborhood.findUnique({
        where: { id: payload.neighborhoodId }
      });
      if (!neighborhood) {
        throw new BadRequestException('Bairro selecionado não existe.');
      }
    }

    let updated;
    try {
      updated = await this.prisma.occurrence.update({ where: { id }, data: payload as any });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Referência inválida. Verifique secretaria, categoria ou bairro.');
      }
      throw error;
    }

    if (data.description || data.title || data.address || data.categoryId) {
      const category = data.categoryId
        ? await this.prisma.category.findUnique({ where: { id: data.categoryId } })
        : current?.categoryId
          ? await this.prisma.category.findUnique({ where: { id: current.categoryId } })
          : null;
      const priorityResult = this.priorityService.calculatePriority({
        title: data.title ?? current?.title,
        description: data.description ?? current?.description ?? '',
        category,
        address: data.address ?? current?.address ?? ''
      });
      await this.prisma.occurrence.update({
        where: { id },
        data: {
          priority: priorityResult.level,
          priorityScore: priorityResult.score
        }
      });
    }

    if (current && data.status && data.status !== current.status) {
      const operationalStatuses: OccurrenceStatus[] = [
        OccurrenceStatus.EM_ANALISE,
        OccurrenceStatus.ENCAMINHADO,
        OccurrenceStatus.EM_EXECUCAO
      ];
      if (operationalStatuses.includes(data.status as OccurrenceStatus)) {
        await this.ensureServiceOrder(id, data.status as OccurrenceStatus);
      }

      await this.prisma.occurrenceMovement.create({
        data: {
          occurrenceId: id,
          fromStatus: current.status,
          toStatus: data.status as OccurrenceStatus,
          note: 'Status atualizado.'
        }
      });

      await this.whatsappService.sendStatusChanged({
        protocol: current.protocol,
        status: data.status as string
      });
    }

    return this.prisma.occurrence.findUnique({
      where: { id: updated.id },
      include: {
        category: true,
        citizen: true,
        neighborhood: true,
        suggestedDepartment: true,
        serviceOrders: {
          include: {
            department: true,
            fieldTeam: true
          }
        },
        movements: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  remove(id: string) {
    return this.prisma.occurrence.delete({ where: { id } });
  }

  findServiceOrders() {
    return this.prisma.serviceOrder.findMany({
      include: {
        occurrence: {
          include: {
            category: true,
            neighborhood: true
          }
        },
        department: true,
        fieldTeam: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async startServiceOrder(id: string, user?: { sub: string; role: UserRole }) {
    if (user) await this.accessScope.assertServiceOrderAccess(user, id);
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!current) return null;
    return this.prisma.serviceOrder.update({
      where: { id },
      data: { startedAt: current.startedAt ?? new Date() }
    });
  }

  async registerServiceOrderExecution(
    id: string,
    data: { teamNote?: string; beforePhotoUrl?: string; afterPhotoUrl?: string },
    user?: { sub: string; role: UserRole }
  ) {
    if (user) await this.accessScope.assertServiceOrderAccess(user, id);
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!current) return null;
    return this.prisma.serviceOrder.update({
      where: { id },
      data: {
        ...data,
        startedAt: current.startedAt ?? new Date()
      }
    });
  }

  async finishServiceOrder(
    id: string,
    data: { teamNote?: string; afterPhotoUrl?: string },
    user?: { sub: string; role: UserRole }
  ) {
    if (user) await this.accessScope.assertServiceOrderAccess(user, id);
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!current) return null;

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data: {
        teamNote: data.teamNote ?? current.teamNote,
        afterPhotoUrl: data.afterPhotoUrl ?? current.afterPhotoUrl,
        startedAt: current.startedAt ?? new Date(),
        finishedAt: new Date()
      }
    });

    await this.prisma.occurrence.update({
      where: { id: current.occurrenceId },
      data: {
        status: OccurrenceStatus.CONCLUIDO
      }
    });

    await this.prisma.occurrenceMovement.create({
      data: {
        occurrenceId: current.occurrenceId,
        fromStatus: OccurrenceStatus.EM_EXECUCAO,
        toStatus: OccurrenceStatus.CONCLUIDO,
        note: 'Ocorrência concluída após finalização da OS.'
      }
    });

    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id: current.occurrenceId },
      select: { protocol: true }
    });
    if (occurrence) {
      await this.whatsappService.sendOccurrenceFinished({
        protocol: occurrence.protocol
      });
    }

    return this.prisma.serviceOrder.findUnique({
      where: { id: updated.id },
      include: {
        occurrence: {
          include: {
            category: true,
            neighborhood: true
          }
        },
        department: true,
        fieldTeam: true
      }
    });
  }

  private async ensureServiceOrder(occurrenceId: string, status: OccurrenceStatus) {
    const existing = await this.prisma.serviceOrder.findUnique({ where: { occurrenceId } });
    if (existing) return existing;

    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id: occurrenceId },
      include: { suggestedDepartment: true }
    });
    if (!occurrence) return null;

    const slaHours = this.getSlaHours(occurrence.priority);

    return this.prisma.serviceOrder.create({
      data: {
        occurrenceId,
        departmentId: occurrence.suggestedDepartmentId ?? undefined,
        priority: occurrence.priority,
        slaHours,
        plannedAt: status === OccurrenceStatus.EM_ANALISE ? new Date() : undefined,
        teamNote: 'OS criada automaticamente a partir do fluxo da ocorrência.'
      }
    });
  }

  private async resolveCoordinates(data: CreateOccurrenceDto) {
    if (data.latitude != null && data.longitude != null) {
      return { latitude: data.latitude, longitude: data.longitude };
    }

    if (!data.address?.trim()) {
      return { latitude: data.latitude, longitude: data.longitude };
    }

    const serviceArea = await this.serviceAreaService.findActive();
    const coords = await this.geocodeAddress(
      data.address,
      serviceArea?.municipio,
      serviceArea?.estado
    );

    return {
      latitude: coords?.latitude ?? data.latitude,
      longitude: coords?.longitude ?? data.longitude
    };
  }

  private async geocodeAddress(address: string, municipio?: string | null, estado?: string | null) {
    const query = [address.trim(), municipio?.trim(), estado?.trim(), 'Brasil'].filter(Boolean).join(', ');
    if (!address.trim()) return null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'ZeladoriaDigital/1.0' } }
      );
      if (!response.ok) return null;
      const results = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!results[0]) return null;
      return {
        latitude: Number(results[0].lat),
        longitude: Number(results[0].lon)
      };
    } catch {
      return null;
    }
  }

  private getSlaHours(priority: PriorityLevel) {
    switch (priority) {
      case PriorityLevel.URGENTE:
        return 4;
      case PriorityLevel.ALTA:
        return 12;
      case PriorityLevel.MEDIA:
        return 24;
      case PriorityLevel.BAIXA:
      default:
        return 48;
    }
  }
}
