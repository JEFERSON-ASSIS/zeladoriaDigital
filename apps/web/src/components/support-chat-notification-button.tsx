'use client';

import { Bell, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPwaServiceWorkerRegistration } from '../lib/pwa';
import { subscribeSupportChatPush } from '../lib/support-chat-api';

type NotificationStatus = 'idle' | 'loading' | 'enabled' | 'denied' | 'error' | 'unsupported';

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function SupportChatNotificationButton({ token, compact = false }: {
  token: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<NotificationStatus>('idle');

  async function subscribe(requestPermission: boolean) {
    if (!token || typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    const permission = requestPermission ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'idle');
      return;
    }

    try {
      const registration = await getPwaServiceWorkerRegistration();
      if (!registration) throw new Error('Service worker indisponível.');
      let pushSubscription = await registration.pushManager.getSubscription();
      if (!pushSubscription) {
        pushSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
      }
      const json = pushSubscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Inscrição push inválida.');
      }
      await subscribeSupportChatPush({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth
      }, token);
      setStatus('enabled');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      void subscribe(false);
    }
  }, [token]);

  if (status === 'unsupported') return null;

  return (
    <div className={`support-notification${compact ? ' is-compact' : ''}`}>
      <div className="support-notification__copy">
        <strong>{status === 'enabled' ? 'Avisos ativados' : 'Receba novas mensagens'}</strong>
        <span>
          {status === 'enabled'
            ? 'Você será avisado quando uma mensagem chegar.'
            : 'Ative as notificações para receber um aviso quando chegar uma nova mensagem.'}
        </span>
      </div>
      <button
        type="button"
        className={status === 'enabled' ? 'is-enabled' : ''}
        disabled={status === 'loading' || status === 'enabled'}
        onClick={() => void subscribe(true)}
      >
        {status === 'enabled' ? <BellRing size={17} /> : <Bell size={17} />}
        {status === 'loading'
          ? 'Ativando...'
          : status === 'enabled' ? 'Notificações ativas' : 'Ativar notificações'}
      </button>
      {status === 'denied' ? <small>Permissão bloqueada. Libere as notificações nas configurações do navegador.</small> : null}
      {status === 'error' ? <small>Não foi possível ativar. Tente novamente.</small> : null}
    </div>
  );
}
