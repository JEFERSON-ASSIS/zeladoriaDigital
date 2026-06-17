import { Injectable } from '@nestjs/common';

export type PushNotificationPermission = 'default' | 'granted' | 'denied';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

@Injectable()
export class PushNotificationService {
  canUsePush() {
    return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  }

  getPermission(): PushNotificationPermission {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission as PushNotificationPermission;
  }

  buildPayload(input: PushNotificationPayload) {
    return {
      title: input.title,
      body: input.body,
      url: input.url ?? '/',
      tag: input.tag ?? 'zeladoria',
      icon: input.icon ?? '/icons/icon-192.png'
    };
  }
}
