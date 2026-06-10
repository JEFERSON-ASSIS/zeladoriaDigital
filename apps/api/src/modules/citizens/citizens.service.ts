import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';

@Injectable()
export class CitizensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCitizenDto) {
    return this.prisma.citizen.create({
      data: {
        ...data,
        password: data.password ? await bcrypt.hash(data.password, 10) : undefined
      } as any
    });
  }

  findByEmail(email: string) {
    return this.prisma.citizen.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.citizen.findUnique({ where: { id } });
  }

  findAll() {
    return this.prisma.citizen.findMany();
  }

  async update(id: string, data: UpdateCitizenDto) {
    const payload = data.password ? { ...data, password: await bcrypt.hash(data.password, 10) } : data;
    return this.prisma.citizen.update({ where: { id }, data: payload as any });
  }

  remove(id: string) {
    return this.prisma.citizen.delete({ where: { id } });
  }
}
