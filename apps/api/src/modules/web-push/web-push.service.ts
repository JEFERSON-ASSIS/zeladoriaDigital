import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {
    this.configure();
  }

  private configure() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')?.trim();
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')?.trim();
    const subject = this.config.get<string>('VAPID_SUBJECT')?.trim() ?? 'mailto:admin@zeladoria.local';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys ausentes — push desativado.');
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
      this.logger.log('Web Push (VAPID) configurado.');
    } catch (error) {
      this.logger.warn('VAPID keys inválidas — push desativado.', error);
    }
  }

  isConfigured() {
    return this.configured;
  }

  async send(subscription: PushSubscriptionKeys, payload: WebPushPayload) {
    if (!this.configured) {
      return { ok: false as const, reason: 'missing-vapid' };
    }

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? '/app/inicio'
      })
    );

    return { ok: true as const };
  }
}
