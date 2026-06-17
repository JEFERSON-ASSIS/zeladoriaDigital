import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO')
  findAll() { return this.departmentsService.findAll(); }

  @Roles('ADMIN')
  @Post() create(@Body() body: CreateDepartmentDto) { return this.departmentsService.create(body); }

  @Roles('ADMIN')
  @Patch(':id') update(@Param('id') id: string, @Body() body: UpdateDepartmentDto) { return this.departmentsService.update(id, body); }

  @Roles('ADMIN')
  @Delete(':id') remove(@Param('id') id: string) { return this.departmentsService.remove(id); }
}
