import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { NeighborhoodsService } from './neighborhoods.service';
import { CreateNeighborhoodDto } from './dto/create-neighborhood.dto';
import { UpdateNeighborhoodDto } from './dto/update-neighborhood.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly service: NeighborhoodsService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO')
  findAll(){ return this.service.findAll(); }

  @Roles('ADMIN')
  @Post() create(@Body() body: CreateNeighborhoodDto){ return this.service.create(body); }

  @Roles('ADMIN')
  @Patch(':id') update(@Param('id') id: string, @Body() body: UpdateNeighborhoodDto){ return this.service.update(id, body); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string){ return this.service.remove(id); }
}
