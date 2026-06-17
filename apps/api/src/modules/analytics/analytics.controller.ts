import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GlobalFiltersDto } from './dto/global-filters.dto';

@Controller('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/executive')
  executiveDashboard(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.executiveDashboard(query);
  }

  @Get('indicadores/status')
  statusIndicatorsPt(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.statusIndicators(query);
  }

  @Get('indicadores/secretarias')
  departmentIndicatorsPt(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.departmentIndicators(query);
  }

  @Get('indicadores/categorias')
  categoryIndicatorsPt(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.categoryIndicators(query);
  }

  @Get('indicadores/bairros')
  neighborhoodIndicatorsPt(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.neighborhoodIndicators(query);
  }

  @Get('indicadores/sla')
  slaIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.generateSlaIndicators(query);
  }

  @Get('indicadores/satisfacao')
  satisfactionIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.executiveDashboard(query);
  }

  @Get('indicadores/reincidencia')
  recurrenceIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.neighborhoodIndicators(query);
  }

  @Get('indicators/status')
  statusIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.statusIndicators(query);
  }

  @Get('indicators/departments')
  departmentIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.departmentIndicators(query);
  }

  @Get('indicators/categories')
  categoryIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.categoryIndicators(query);
  }

  @Get('indicators/neighborhoods')
  neighborhoodIndicators(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.neighborhoodIndicators(query);
  }

  @Get('ranking')
  ranking(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.ranking(query);
  }

  @Get('ranking/demandas')
  rankingDemandas(@Query() query: GlobalFiltersDto) {
    return this.analyticsService.ranking(query);
  }

  @Post('prioritizacao/recalcular')
  @Post('prioritization/recalculate')
  recalculatePrioritization() {
    return this.analyticsService.recalculatePrioritization();
  }

  @Get('alerts')
  alerts() {
    return this.analyticsService.alerts();
  }

  @Post('ia/resumo-gerencial')
  @Post('ai/executive-summary')
  executiveSummary(@Body() body: GlobalFiltersDto) {
    return this.analyticsService.generateExecutiveSummary(body);
  }

  @Post('ia/sugerir-prioridade')
  suggestPriority(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.suggestPriority(body);
  }

  @Post('ia/sugerir-categoria')
  suggestCategory(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.suggestCategory(body);
  }

  @Post('ia/detectar-duplicidade')
  detectDuplicate(@Body() body: { title?: string; description: string }) {
    return this.analyticsService.detectDuplicate(body);
  }
}
