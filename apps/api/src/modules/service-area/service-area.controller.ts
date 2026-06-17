import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ServiceAreaService } from './service-area.service';
import { UpsertServiceAreaDto } from './dto/upsert-service-area.dto';

@Controller('admin/service-area')
export class ServiceAreaController {
  constructor(private readonly serviceAreaService: ServiceAreaService) {}

  @Get()
  findAll() {
    return this.serviceAreaService.findAll();
  }

  @Post()
  create(@Body() body: UpsertServiceAreaDto) {
    return this.serviceAreaService.upsert(undefined, body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpsertServiceAreaDto) {
    return this.serviceAreaService.upsert(id, body);
  }

  @Post('validate')
  validate(@Body() body: { latitude?: number; longitude?: number; municipio?: string; estado?: string }) {
    return this.serviceAreaService.validate(body);
  }
}
