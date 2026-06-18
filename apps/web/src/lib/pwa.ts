import { PWA_SW_URL, PWA_SCOPE } from './pwa-constants';

export {
  PWA_SCOPE,
  PWA_SW_URL,
  PWA_MANIFEST_URL,
  PWA_LOGIN,
  PWA_HOME,
  PWA_CITIZEN_ROUTES,
  pwaPath
} from './pwa-constants';

export function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export async function registerPwaServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration(`${PWA_SCOPE}/`);
    if (existing) return existing;
    return await navigator.serviceWorker.register(PWA_SW_URL, { scope: `${PWA_SCOPE}/` });
  } catch {
    return null;
  }
}

export async function getPwaServiceWorkerRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const existing = await navigator.serviceWorker.getRegistration(`${PWA_SCOPE}/`);
  if (existing) return existing;

  return registerPwaServiceWorker();
}
