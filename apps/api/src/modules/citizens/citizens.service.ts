import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { normalizeCitizenCpf, normalizeCitizenPhone } from './citizen-identifiers';
import type { HealthUnitPsfId } from '@zeladoria/shared';

@Injectable()
export class CitizensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCitizenDto) {
    return this.prisma.citizen.create({
      data: {
        ...data,
        name: data.name.trim().replace(/\s+/g, ' '),
        phone: data.phone ? normalizeCitizenPhone(data.phone) : undefined,
        cpf: data.cpf ? normalizeCitizenCpf(data.cpf) : undefined,
        password: data.password ? await bcrypt.hash(data.password, 10) : undefined
      } as any
    });
  }

  findByEmail(email: string) {
    return this.prisma.citizen.findUnique({ where: { email } });
  }

  findByCpf(cpf: string) {
    return this.prisma.citizen.findUnique({ where: { cpf: normalizeCitizenCpf(cpf) } });
  }

  findByPhone(phone: string) {
    return this.prisma.citizen.findFirst({
      where: { phone: normalizeCitizenPhone(phone) }
    });
  }

  findById(id: string) {
    return this.prisma.citizen.findUnique({ where: { id } });
  }

  findAll(healthUnitPsfId?: HealthUnitPsfId) {
    return this.prisma.citizen.findMany({
      where: healthUnitPsfId ? { healthUnitPsfId } : undefined,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getActivity(id: string) {
    const [occurrences, pushSubscriptionsCount] = await Promise.all([
      this.prisma.occurrence.findMany({
        where: { citizenId: id },
        select: {
          id: true,
          protocol: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      this.prisma.citizenPushSubscription.count({ where: { citizenId: id } })
    ]);

    return { occurrences, pushSubscriptionsCount };
  }

  registerAccess(phone: string, cpf: string, healthUnitPsfId: HealthUnitPsfId, name: string) {
    return this.prisma.citizen.create({
      data: {
        name,
        phone: normalizeCitizenPhone(phone),
        cpf: normalizeCitizenCpf(cpf),
        healthUnitPsfId,
        lgpdAcceptedAt: new Date()
      }
    });
  }

  assignHealthUnit(id: string, healthUnitPsfId: HealthUnitPsfId) {
    return this.prisma.citizen.update({
      where: { id },
      data: { healthUnitPsfId }
    });
  }

  acceptLgpd(id: string) {
    return this.prisma.citizen.update({
      where: { id },
      data: { lgpdAcceptedAt: new Date() }
    });
  }

  async update(id: string, data: UpdateCitizenDto) {
    const payload: Record<string, unknown> = {
      ...data,
      name: data.name ? data.name.trim().replace(/\s+/g, ' ') : data.name,
      phone: data.phone ? normalizeCitizenPhone(data.phone) : data.phone,
      cpf: data.cpf ? normalizeCitizenCpf(data.cpf) : data.cpf,
      password: data.password ? await bcrypt.hash(data.password, 10) : undefined
    };

    if (data.blocked !== undefined) {
      payload.blockedAt = data.blocked ? new Date() : null;
      if (!data.blocked) {
        payload.blockedReason = null;
      }
      delete payload.blocked;
    }

    if (data.blockedReason !== undefined && data.blocked !== false) {
      payload.blockedReason = data.blockedReason;
    }

    return this.prisma.citizen.update({ where: { id }, data: payload as any });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.citizenPushSubscription.deleteMany({ where: { citizenId: id } });
      await tx.occurrence.updateMany({ where: { citizenId: id }, data: { citizenId: null } });
      return tx.citizen.delete({ where: { id } });
    });
  }
}
