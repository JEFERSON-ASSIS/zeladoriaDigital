/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-7zYpdfzrse8flqfV3OpN7';
const OFFLINE_URL = '/app/offline';

const PRECACHE = [
  "/app/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/app/login",
  "/app",
  "/app/nova-ocorrencia",
  "/app/minhas-solicitacoes",
  "/app/agendamento",
  "/app/meus-agendamentos",
  "/app/offline",
  "/_next/static/chunks/webpack-31840eeeea051c06.js",
  "/_next/static/chunks/1dd3208c-8ac6d030563cdc22.js",
  "/_next/static/chunks/1528-07016564a7999de4.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/d2002aa0833c2402.css",
  "/_next/static/chunks/9569-d0c0301a611c4be8.js",
  "/_next/static/chunks/app/layout-63ade7159f7f0591.js",
  "/_next/static/chunks/3430-ab639be8fa13c790.js",
  "/_next/static/chunks/app/app/login/page-163aa3024d64e553.js",
  "/_next/static/chunks/app/app/layout-ebfa3e820d4031ab.js",
  "/_next/static/chunks/5248-88f0df1f4a720bfc.js",
  "/_next/static/chunks/465-1786530d6982f106.js",
  "/_next/static/chunks/app/app/meus-agendamentos/page-4749f3a4e1d03f5f.js",
  "/_next/static/chunks/9837-7e4ba5566df55d18.js",
  "/_next/static/chunks/140-6affe8bdc675cc23.js",
  "/_next/static/chunks/app/app/minhas-solicitacoes/page-0de7602d2acfea36.js",
  "/_next/static/chunks/app/app/page-5c6199b803a5528b.js",
  "/_next/static/chunks/app/app/offline/page-386fc33fb4479871.js",
  "/_next/static/chunks/app/app/agendamento/page-ade87a6c7f4d89f4.js",
  "/_next/static/chunks/306-329559592c8709fd.js",
  "/_next/static/chunks/app/app/nova-ocorrencia/page-c2c94e61c010e6f2.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/7zYpdfzrse8flqfV3OpN7/_buildManifest.js",
  "/_next/static/7zYpdfzrse8flqfV3OpN7/_ssgManifest.js"
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
  return pathname.startsWith('/_next/static/') || pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isAppRequest(url) && !isStaticAsset(url.pathname)) return;

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
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

self.addEventListener('push', (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.title ?? 'Prefeitura na Mão';
  const options = {
    body: payload.body ?? 'Você tem uma nova atualização.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url ?? '/app/meus-agendamentos' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/app/meus-agendamentos';
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
