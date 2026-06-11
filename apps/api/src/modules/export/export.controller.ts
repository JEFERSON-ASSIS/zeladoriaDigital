import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('admin/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  async export(
    @Body() body: { format: 'pdf' | 'csv' | 'xlsx'; filters?: Record<string, unknown> },
    @Res() res: Response
  ) {
    const payload = await this.exportService.exportGrid(body.format, body.filters ?? {});
    res.setHeader('Content-Type', payload.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    return res.send(payload.body);
  }
}
