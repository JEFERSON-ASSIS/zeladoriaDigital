import { getPwaServiceWorkerRegistration } from './pwa';
import { subscribeCitizenPush } from './announcements-api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function canUseCitizenPush() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function requestCitizenNotificationPermission() {
  if (!canUseCitizenPush()) return 'unsupported' as const;
  if (Notification.permission === 'granted') return 'granted' as const;
  if (Notification.permission === 'denied') return 'denied' as const;
  const result = await Notification.requestPermission();
  return result;
}

export async function subscribeCitizenAppPush(accessToken: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false as const, reason: 'missing-vapid' };
  }

  const registration = await getPwaServiceWorkerRegistration();
  if (!registration) {
    return { ok: false as const, reason: 'missing-sw' };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false as const, reason: 'invalid-subscription' };
  }

  await subscribeCitizenPush(
    {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    },
    accessToken
  );

  return { ok: true as const };
}
