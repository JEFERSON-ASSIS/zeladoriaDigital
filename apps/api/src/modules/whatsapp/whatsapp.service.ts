import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  sendProtocolCreated() { return { queued: true }; }
  sendStatusChanged() { return { queued: true }; }
  sendOccurrenceFinished() { return { queued: true }; }
}
