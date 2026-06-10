import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { OccurrenceStatus, PriorityLevel, Prisma } from '@prisma/client';
import { PriorityService } from '../priority/priority.service';

@Injectable()
export class OccurrencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priorityService: PriorityService
  ) {}

  findAll() {
    return this.prisma.occurrence.findMany({
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findByCitizen(citizenId: string) {
    return this.prisma.occurrence.findMany({
      where: { citizenId },
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
        }
      },
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
        }
      }
    });
  }

  async create(data: CreateOccurrenceDto) {
    const normalizedStatus = (data.status ?? OccurrenceStatus.ABERTO) as OccurrenceStatus;
    const [category, departments] = await Promise.all([
      data.categoryId ? this.prisma.category.findUnique({ where: { id: data.categoryId } }) : Promise.resolve(null),
      this.prisma.department.findMany({ select: { id: true, name: true, municipalityId: true, createdAt: true, updatedAt: true } })
    ]);
    const priorityResult = this.priorityService.calculatePriority({
      title: data.title,
      description: data.description,
      category,
      address: data.address
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
    const occurrence = await this.prisma.occurrence.create({
      data: {
        ...data,
        status: normalizedStatus,
        priority: (data.priority ?? priorityResult.level) as PriorityLevel,
        priorityScore: priorityResult.score,
        duplicateGroupId: duplicate ? duplicate.id : undefined,
        suggestedDepartmentId: data.suggestedDepartmentId ?? suggestedDepartment?.id,
        protocol: `OC-${Date.now()}`
      } as any
    });

    await this.prisma.occurrenceMovement.create({
      data: {
        occurrenceId: occurrence.id,
        fromStatus: null,
        toStatus: normalizedStatus,
        note: 'Ocorrência criada.'
      }
    });

    return this.prisma.occurrence.findUnique({
      where: { id: occurrence.id },
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
        }
      }
    });
  }

  async update(id: string, data: UpdateOccurrenceDto) {
    const current = await this.prisma.occurrence.findUnique({ where: { id } });
    const updated = await this.prisma.occurrence.update({ where: { id }, data: data as any });

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
    }

    return this.prisma.occurrence.findUnique({
      where: { id: updated.id },
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

  async startServiceOrder(id: string) {
    const current = await this.prisma.serviceOrder.findUnique({ where: { id } });
    if (!current) return null;
    return this.prisma.serviceOrder.update({
      where: { id },
      data: { startedAt: current.startedAt ?? new Date() }
    });
  }

  async registerServiceOrderExecution(id: string, data: { teamNote?: string; beforePhotoUrl?: string; afterPhotoUrl?: string }) {
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

  async finishServiceOrder(id: string, data: { teamNote?: string; afterPhotoUrl?: string }) {
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
