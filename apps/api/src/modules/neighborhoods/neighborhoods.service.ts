import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
@Injectable()
export class NeighborhoodsService {
  constructor(private readonly prisma: PrismaService) {}
  findAll(){ return this.prisma.neighborhood.findMany(); }
  create(data: CreateNeighborhoodDto) { return this.prisma.neighborhood.create({ data: data as any }); }
  update(id: string, data: UpdateNeighborhoodDto) { return this.prisma.neighborhood.update({ where: { id }, data: data as any }); }
  remove(id: string) { return this.prisma.neighborhood.delete({ where: { id } }); }
}
