import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsAppService {
  sendProtocolCreated(input: { protocol: string; phone?: string | null; message?: string }) {
    return {
      queued: true,
      channel: 'whatsapp',
      event: 'protocol_created',
      protocol: input.protocol,
      phone: input.phone ?? null,
      message: input.message ?? `Protocolo ${input.protocol} criado com sucesso.`
    };
  }

  sendStatusChanged(input: { protocol: string; status: string; phone?: string | null; message?: string }) {
    return {
      queued: true,
      channel: 'whatsapp',
      event: 'status_changed',
      protocol: input.protocol,
      status: input.status,
      phone: input.phone ?? null,
      message: input.message ?? `O status do protocolo ${input.protocol} foi alterado para ${input.status}.`
    };
  }

  sendOccurrenceFinished(input: { protocol: string; phone?: string | null; message?: string }) {
    return {
      queued: true,
      channel: 'whatsapp',
      event: 'occurrence_finished',
      protocol: input.protocol,
      phone: input.phone ?? null,
      message: input.message ?? `A ocorrencia ${input.protocol} foi concluida.`
    };
  }
}
