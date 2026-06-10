import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Req } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('occurrences')
export class OccurrencesController {
  constructor(private readonly occurrencesService: OccurrencesService) {}

  @Get()
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  findAll() {
    return this.occurrencesService.findAll();
  }

  @Get('mine')
  @Roles('CIDADAO')
  findMine(@Req() req: { user: { sub: string } }) {
    return this.occurrencesService.findByCitizen(req.user.sub);
  }

  @Get('protocol/:protocol')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO', 'CIDADAO')
  findByProtocol(@Param('protocol') protocol: string) {
    return this.occurrencesService.findByProtocol(protocol);
  }

  @Post()
  @Roles('ADMIN', 'PREFEITURA', 'TRIAGEM', 'CIDADAO')
  create(@Body() body: CreateOccurrenceDto) {
    return this.occurrencesService.create(body);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'TRIAGEM', 'EQUIPE_CAMPO')
  update(@Param('id') id: string, @Body() body: UpdateOccurrenceDto) {
    return this.occurrencesService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.occurrencesService.remove(id);
  }

  @Patch('service-orders/:id/start')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  startServiceOrder(@Param('id') id: string) {
    return this.occurrencesService.startServiceOrder(id);
  }

  @Patch('service-orders/:id/execution')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  registerServiceOrderExecution(
    @Param('id') id: string,
    @Body() body: { teamNote?: string; beforePhotoUrl?: string; afterPhotoUrl?: string }
  ) {
    return this.occurrencesService.registerServiceOrderExecution(id, body);
  }

  @Patch('service-orders/:id/finish')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA', 'EQUIPE_CAMPO')
  finishServiceOrder(
    @Param('id') id: string,
    @Body() body: { teamNote?: string; afterPhotoUrl?: string }
  ) {
    return this.occurrencesService.finishServiceOrder(id, body);
  }
}
