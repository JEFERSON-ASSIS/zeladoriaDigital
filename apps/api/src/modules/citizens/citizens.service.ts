import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { normalizeCitizenCpf, normalizeCitizenPhone } from './citizen-identifiers';

@Injectable()
export class CitizensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCitizenDto) {
    return this.prisma.citizen.create({
      data: {
        ...data,
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

  findAll() {
    return this.prisma.citizen.findMany();
  }

  registerAccess(phone: string, cpf: string) {
    return this.prisma.citizen.create({
      data: {
        name: 'Cidadão',
        phone: normalizeCitizenPhone(phone),
        cpf: normalizeCitizenCpf(cpf),
        lgpdAcceptedAt: new Date()
      }
    });
  }

  acceptLgpd(id: string) {
    return this.prisma.citizen.update({
      where: { id },
      data: { lgpdAcceptedAt: new Date() }
    });
  }

  async update(id: string, data: UpdateCitizenDto) {
    const payload = {
      ...data,
      phone: data.phone ? normalizeCitizenPhone(data.phone) : data.phone,
      cpf: data.cpf ? normalizeCitizenCpf(data.cpf) : data.cpf,
      password: data.password ? await bcrypt.hash(data.password, 10) : undefined
    };
    return this.prisma.citizen.update({ where: { id }, data: payload as any });
  }

  remove(id: string) {
    return this.prisma.citizen.delete({ where: { id } });
  }
}
