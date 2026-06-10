import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO')
  findAll(){ return this.service.findAll(); }

  @Roles('ADMIN')
  @Post() create(@Body() body: CreateCategoryDto){ return this.service.create(body); }

  @Roles('ADMIN')
  @Patch(':id') update(@Param('id') id: string, @Body() body: UpdateCategoryDto){ return this.service.update(id, body); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string){ return this.service.remove(id); }
}
