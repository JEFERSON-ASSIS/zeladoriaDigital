import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { GlobalFiltersDto } from './dto/global-filters.dto';

type RequestUser = { sub: string; role: UserRole };

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/executive')
  @Roles('ADMIN', 'PREFEITURA')
  executiveDashboard(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.executiveDashboard(query, req.user);
  }

  @Get('indicadores/status')
  @Roles('ADMIN', 'PREFEITURA')
  statusIndicatorsPt(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.statusIndicators(query, req.user);
  }

  @Get('indicadores/secretarias')
  @Roles('ADMIN', 'PREFEITURA')
  departmentIndicatorsPt(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.departmentIndicators(query, req.user);
  }

  @Get('indicadores/categorias')
  @Roles('ADMIN', 'PREFEITURA')
  categoryIndicatorsPt(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.categoryIndicators(query, req.user);
  }

  @Get('indicadores/bairros')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA')
  neighborhoodIndicatorsPt(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.neighborhoodIndicators(query, req.user);
  }

  @Get('indicadores/sla')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA')
  slaIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.generateSlaIndicators(query, req.user);
  }

  @Get('indicadores/satisfacao')
  @Roles('ADMIN', 'PREFEITURA')
  satisfactionIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.executiveDashboard(query, req.user);
  }

  @Get('indicadores/reincidencia')
  @Roles('ADMIN', 'PREFEITURA')
  recurrenceIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.neighborhoodIndicators(query, req.user);
  }

  @Get('indicators/status')
  @Roles('ADMIN', 'PREFEITURA')
  statusIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.statusIndicators(query, req.user);
  }

  @Get('indicators/departments')
  @Roles('ADMIN', 'PREFEITURA')
  departmentIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.departmentIndicators(query, req.user);
  }

  @Get('indicators/categories')
  @Roles('ADMIN', 'PREFEITURA')
  categoryIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.categoryIndicators(query, req.user);
  }

  @Get('indicators/neighborhoods')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA')
  neighborhoodIndicators(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.neighborhoodIndicators(query, req.user);
  }

  @Get('ranking')
  @Roles('ADMIN', 'PREFEITURA')
  ranking(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.ranking(query, req.user);
  }

  @Get('ranking/demandas')
  @Roles('ADMIN', 'PREFEITURA')
  rankingDemandas(@Query() query: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.ranking(query, req.user);
  }

  @Post('prioritizacao/recalcular')
  @Post('prioritization/recalculate')
  @Roles('ADMIN', 'PREFEITURA')
  recalculatePrioritization(@Req() req: { user: RequestUser }) {
    return this.analyticsService.ranking({}, req.user);
  }

  @Get('alerts')
  @Roles('ADMIN', 'PREFEITURA', 'SECRETARIA')
  alerts(@Req() req: { user: RequestUser }) {
    return this.analyticsService.alerts(req.user);
  }

  @Post('ia/resumo-gerencial')
  @Post('ai/executive-summary')
  @Roles('ADMIN', 'PREFEITURA')
  executiveSummary(@Body() body: GlobalFiltersDto, @Req() req: { user: RequestUser }) {
    return this.analyticsService.generateExecutiveSummary(body, req.user);
  }

  @Post('ia/sugerir-prioridade')
  @Roles('ADMIN', 'PREFEITURA')
  suggestPriority(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.suggestPriority(body);
  }

  @Post('ia/sugerir-categoria')
  @Roles('ADMIN', 'PREFEITURA')
  suggestCategory(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.suggestCategory(body);
  }

  @Post('ia/detectar-duplicidade')
  @Roles('ADMIN', 'PREFEITURA')
  detectDuplicate(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.detectDuplicate(body);
  }
}
