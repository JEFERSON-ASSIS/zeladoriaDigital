import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  generate(@Body() body: { periodStart?: string; periodEnd?: string }) {
    return this.reportsService.generate(body);
  }

  @Get('download/:format')
  async download(@Param('format') format: 'pdf' | 'csv' | 'xlsx', @Res() res: Response) {
    const payload = await this.reportsService.download(format);
    res.setHeader('Content-Type', payload.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    return res.send(payload.body);
  }
}
