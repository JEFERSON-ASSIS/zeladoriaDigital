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

  @Post('prioritization/recalculate')
  recalculatePrioritization() {
    return this.analyticsService.recalculatePrioritization();
  }

  @Get('alerts')
  alerts() {
    return this.analyticsService.alerts();
  }

  @Post('ai/executive-summary')
  executiveSummary(@Body() body: GlobalFiltersDto) {
    return this.analyticsService.generateExecutiveSummary(body);
  }
}
