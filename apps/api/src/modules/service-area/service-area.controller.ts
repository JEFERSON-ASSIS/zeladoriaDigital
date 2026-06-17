import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ServiceAreaService } from './service-area.service';
import { UpsertServiceAreaDto } from './dto/upsert-service-area.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/service-area')
export class ServiceAreaController {
  constructor(private readonly serviceAreaService: ServiceAreaService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  findAll() {
    return this.serviceAreaService.findAll();
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() body: UpsertServiceAreaDto) {
    return this.serviceAreaService.upsert(undefined, body);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpsertServiceAreaDto) {
    return this.serviceAreaService.upsert(id, body);
  }

  @Post('validate')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'CIDADAO')
  validate(@Body() body: { latitude?: number; longitude?: number; municipio?: string; estado?: string }) {
    return this.serviceAreaService.validate(body);
  }
}
