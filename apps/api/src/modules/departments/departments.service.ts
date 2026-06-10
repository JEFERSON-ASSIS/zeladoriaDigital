import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}
  findAll() { return this.prisma.department.findMany(); }
  create(data: CreateDepartmentDto) { return this.prisma.department.create({ data: data as any }); }
  update(id: string, data: UpdateDepartmentDto) { return this.prisma.department.update({ where: { id }, data: data as any }); }
  remove(id: string) { return this.prisma.department.delete({ where: { id } }); }
}
