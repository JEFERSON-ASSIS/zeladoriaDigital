import { PWA_SW_URL, PWA_SCOPE } from './pwa-constants';

export {
  PWA_SCOPE,
  PWA_SW_URL,
  PWA_MANIFEST_URL,
  PWA_LOGIN,
  PWA_HOME,
  PWA_PRIVACY_POLICY,
  PWA_CITIZEN_ROUTES,
  pwaPath,
  buildPwaLoginUrl
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
    const registration = await navigator.serviceWorker.register(PWA_SW_URL, { scope: `${PWA_SCOPE}/` });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    });

    return registration;
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

export function exitPwaOrFallback(fallbackUrl: string) {
  if (typeof window === 'undefined') return;

  if (!isStandaloneDisplayMode()) {
    window.location.replace(fallbackUrl);
    return;
  }

  window.setTimeout(() => {
    if (document.visibilityState !== 'hidden') {
      window.location.replace(fallbackUrl);
    }
  }, 350);

  window.open('', '_self');
  window.close();
}
