import { getSession } from '../auth';
import { getSavedPsfConfig, getPatientProfile, onlyDigits } from './psf-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function registerSchedulingServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;

  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

export async function requestSchedulingNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported' as const;
  }

  await registerSchedulingServiceWorker();

  if (Notification.permission === 'granted') {
    return 'granted' as const;
  }

  if (Notification.permission === 'denied') {
    return 'denied' as const;
  }

  const result = await Notification.requestPermission();
  return result;
}

export async function subscribeSchedulingPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false as const, reason: 'unsupported' };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { ok: false as const, reason: 'missing-vapid' };
  }

  const permission = await requestSchedulingNotificationPermission();
  if (permission !== 'granted') {
    return { ok: false as const, reason: permission };
  }

  const registration = await registerSchedulingServiceWorker();
  if (!registration) {
    return { ok: false as const, reason: 'sw-failed' };
  }

  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const psf = getSavedPsfConfig();
  const profile = getPatientProfile();
  const session = getSession();
  const cpf = onlyDigits(profile?.cpf ?? '');

  if (!psf || cpf.length !== 11) {
    return { ok: false as const, reason: 'missing-profile' };
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    return { ok: false as const, reason: 'invalid-subscription' };
  }

  const response = await fetch(`${API_URL}/scheduling-reminders/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
    },
    body: JSON.stringify({
      cpf,
      psfId: psf.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth
    })
  });

  if (!response.ok) {
    return { ok: false as const, reason: 'api-error' };
  }

  return { ok: true as const };
}

export function canUseSchedulingPush() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    Boolean(VAPID_PUBLIC_KEY)
  );
}
