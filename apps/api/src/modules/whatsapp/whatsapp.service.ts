import { Injectable, Logger } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type WhatsAppSendResult = {
  queued: boolean;
  delivered: boolean;
  channel: 'whatsapp';
  event: 'protocol_created' | 'status_changed' | 'occurrence_finished';
  protocol: string;
  phone: string | null;
  message: string;
  messageId: string;
  provider: 'meta-cloud-api' | 'local-queue';
};

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendProtocolCreated(input: { protocol: string; phone?: string | null; message?: string }): Promise<WhatsAppSendResult> {
    const message = input.message ?? `Protocolo ${input.protocol} criado com sucesso.`;
    return this.dispatchMessage('protocol_created', input.protocol, input.phone ?? null, message);
  }

  async sendStatusChanged(input: { protocol: string; status: string; phone?: string | null; message?: string }): Promise<WhatsAppSendResult> {
    const message = input.message ?? `O status do protocolo ${input.protocol} foi alterado para ${input.status}.`;
    return this.dispatchMessage('status_changed', input.protocol, input.phone ?? null, message);
  }

  async sendOccurrenceFinished(input: { protocol: string; phone?: string | null; message?: string }): Promise<WhatsAppSendResult> {
    const message = input.message ?? `A ocorrência ${input.protocol} foi concluída.`;
    return this.dispatchMessage('occurrence_finished', input.protocol, input.phone ?? null, message);
  }

  async listHistory(limit = 50): Promise<Message[]> {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200)
    });
  }

  private async dispatchMessage(
    event: WhatsAppSendResult['event'],
    protocol: string,
    phone: string | null,
    message: string
  ): Promise<WhatsAppSendResult> {
    const subject = `whatsapp:${event}:${protocol}`;
    const provider = this.resolveProvider();
    const delivered = provider === 'meta-cloud-api' ? await this.sendViaMetaCloudApi(phone, message) : false;

    const record = await this.prisma.message.create({
      data: {
        subject,
        body: JSON.stringify({
          event,
          protocol,
          phone,
          message,
          provider,
          delivered,
          createdAt: new Date().toISOString()
        })
      }
    });

    this.logger.log(`Mensagem WhatsApp registrada (${event}) para protocolo ${protocol}. Provider: ${provider}.`);

    return {
      queued: true,
      delivered,
      channel: 'whatsapp',
      event,
      protocol,
      phone,
      message,
      messageId: record.id,
      provider
    };
  }

  private resolveProvider(): WhatsAppSendResult['provider'] {
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return token && phoneNumberId ? 'meta-cloud-api' : 'local-queue';
  }

  private async sendViaMetaCloudApi(phone: string | null, message: string): Promise<boolean> {
    const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const recipient = phone ?? process.env.WHATSAPP_DEFAULT_RECIPIENT;
    const apiVersion = process.env.WHATSAPP_API_VERSION ?? 'v19.0';

    if (!token || !phoneNumberId || !recipient) {
      return false;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { body: message }
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.warn(`Falha ao enviar WhatsApp: ${response.status} ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(`Erro ao enviar WhatsApp: ${(error as Error).message}`);
      return false;
    }
  }
}
