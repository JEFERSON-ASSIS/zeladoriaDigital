import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { PushLogsService } from './push-logs.service';

@UseGuards(JwtAuthGuard)
@Controller('push-logs')
export class PushLogsController {
  constructor(private readonly service: PushLogsService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA')
  findAll(@Query('limit') limit?: string) {
    const parsed = Number(limit);
    const take = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
    return this.service.findAll(take);
  }

  @Get(':id')
  @Roles('ADMIN', 'PREFEITURA')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
