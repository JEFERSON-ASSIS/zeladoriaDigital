import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  generate(@Body() body: { periodStart?: string; periodEnd?: string }) {
    return this.reportsService.generate(body);
  }

  @Get('download/:format')
  download(@Param('format') format: 'pdf' | 'csv' | 'xlsx') {
    return this.reportsService.download(format);
  }
}
