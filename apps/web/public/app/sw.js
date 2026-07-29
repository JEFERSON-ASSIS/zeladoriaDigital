/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-yA2OKQjMPC4Xt5vfy75HX';
const OFFLINE_URL = '/app/offline';

const PRECACHE = [
  "/app/manifest/psf1",
  "/app/manifest/psf2",
  "/app/manifest/psf3",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/notification-icon.png",
  "/icons/notification-badge.png",
  "/app/splash/iphone-se.png",
  "/app/splash/iphone-xr.png",
  "/app/splash/iphone-12.png",
  "/app/splash/iphone-14-pro-max.png",
  "/app/login",
  "/app",
  "/app/inicio",
  "/app/nova-ocorrencia",
  "/app/minhas-solicitacoes",
  "/app/saude",
  "/app/agendamento",
  "/app/meus-agendamentos",
  "/app/unidade/psf1",
  "/app/unidade/psf2",
  "/app/unidade/psf3",
  "/app/unidade/psf1/agendamento",
  "/app/unidade/psf2/agendamento",
  "/app/unidade/psf3/agendamento",
  "/app/unidade/psf1/meus-agendamentos",
  "/app/unidade/psf2/meus-agendamentos",
  "/app/unidade/psf3/meus-agendamentos",
  "/app/offline",
  "/_next/static/chunks/webpack-9af8eb356ac00cc2.js",
  "/_next/static/chunks/1dd3208c-4526bc50a90d281e.js",
  "/_next/static/chunks/1528-7bc95a8e56330ee2.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/8f2e60e9c2fbbefc.css",
  "/_next/static/chunks/9569-9a6c5cf709dffd76.js",
  "/_next/static/chunks/app/layout-bda80d47962bf85d.js",
  "/_next/static/chunks/6340-f76583ab98bd68f9.js",
  "/_next/static/chunks/8134-869987d7daeb144b.js",
  "/_next/static/chunks/4155-717adcdac3fa2dc9.js",
  "/_next/static/chunks/1673-5909c6c10e70fbaf.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-180649366ad8dd9b.js",
  "/_next/static/chunks/app/app/(main)/layout-750023a70fcdf19e.js",
  "/_next/static/chunks/app/app/layout-2dd1c3c33d69a8bb.js",
  "/_next/static/chunks/2000-b1e3eb86316f2839.js",
  "/_next/static/chunks/7000-c41a8eb292a58e09.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-72c49d44c99ea1d8.js",
  "/_next/static/chunks/1821-f98986a49de80438.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-367696f2d65da75b.js",
  "/_next/static/chunks/8688-36a50d23880f9780.js",
  "/_next/static/chunks/app/app/(main)/conversas/page-e5f04e15ac8c28c0.js",
  "/_next/static/chunks/app/app/(main)/offline/page-d8330091ea93ce24.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/140-8db5ca9739dcfa8d.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-9e52f0fdfb8fcc29.js",
  "/_next/static/chunks/6252-44ada19369efaaec.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-779b5be7d4e5c650.js",
  "/_next/static/chunks/app/app/(main)/saude/page-df7f42cb070c485d.js",
  "/_next/static/chunks/app/app/(main)/page-9a4f31f7189e1903.js",
  "/_next/static/chunks/app/app/(main)/politica-privacidade/page-f9b6470168d56503.js",
  "/_next/static/chunks/app/app/login/page-6322daa91f980247.js",
  "/_next/static/chunks/app/app/login/layout-2213b4bb16dc08aa.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-d71609923e7ea733.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-3f394cfab0b41bc5.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/conversas/page-1f90f2d6dfb0723d.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-9d6e09cffb0c8bd7.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-2f7a3828f4c72799.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/yA2OKQjMPC4Xt5vfy75HX/_buildManifest.js",
  "/_next/static/yA2OKQjMPC4Xt5vfy75HX/_ssgManifest.js"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            /* ignora URL que falhar no precache */
          }
        })
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isAppRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/app');
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/app/splash/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isAppRequest(url) && !isStaticAsset(url.pathname)) return;

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.title ?? 'Prefeitura na Mão';
  const origin = self.location.origin;
  const options = {
    body: payload.body ?? 'Você tem uma nova atualização.',
    icon: payload.icon ?? `${origin}/icons/notification-icon.png`,
    badge: payload.badge ?? `${origin}/icons/notification-badge.png`,
    data: { url: payload.url ?? '/app/inicio' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/app/inicio';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
