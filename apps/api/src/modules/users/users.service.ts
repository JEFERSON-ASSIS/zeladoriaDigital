import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data: { ...data, password: await bcrypt.hash(data.password, 10) } as any
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async update(id: string, data: UpdateUserDto) {
    const payload = data.password ? { ...data, password: await bcrypt.hash(data.password, 10) } : data;
    return this.prisma.user.update({ where: { id }, data: payload as any });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
