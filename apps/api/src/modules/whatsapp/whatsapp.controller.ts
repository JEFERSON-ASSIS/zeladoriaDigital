import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('protocol-created')
  protocolCreated(@Body() body: { protocol: string; phone?: string; message?: string }) {
    return this.whatsappService.sendProtocolCreated(body);
  }

  @Post('status-changed')
  statusChanged(@Body() body: { protocol: string; status: string; phone?: string; message?: string }) {
    return this.whatsappService.sendStatusChanged(body);
  }

  @Post('occurrence-finished')
  occurrenceFinished(@Body() body: { protocol: string; phone?: string; message?: string }) {
    return this.whatsappService.sendOccurrenceFinished(body);
  }

  @Get('history')
  history(@Query('limit') limit?: string) {
    return this.whatsappService.listHistory(limit ? Number(limit) : 50);
  }
}
