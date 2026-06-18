/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-4jZT8SCf-ZQzEPBzcpEkw';
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
  "/_next/static/css/418a347a3117bdbd.css",
  "/_next/static/chunks/9569-d0c0301a611c4be8.js",
  "/_next/static/chunks/app/layout-63ade7159f7f0591.js",
  "/_next/static/chunks/2738-5ca37ba278de3305.js",
  "/_next/static/chunks/4558-846999df0a001358.js",
  "/_next/static/chunks/1590-e6f5b815b0663982.js",
  "/_next/static/chunks/244-36f8fe96d247ee49.js",
  "/_next/static/chunks/app/app/agendamento/page-75774c98812bb010.js",
  "/_next/static/chunks/app/app/layout-ef5ecb3365a3a04c.js",
  "/_next/static/chunks/app/app/inicio/page-904804c0344b1b77.js",
  "/_next/static/chunks/app/app/login/page-d60ae4314abb10f2.js",
  "/_next/static/chunks/465-e94801917468f4d7.js",
  "/_next/static/chunks/app/app/meus-agendamentos/page-da385f44b14721a5.js",
  "/_next/static/chunks/306-7d13a46b7dcc6c74.js",
  "/_next/static/chunks/app/app/nova-ocorrencia/page-dacb8cff98c6be40.js",
  "/_next/static/chunks/app/app/offline/page-386fc33fb4479871.js",
  "/_next/static/chunks/9837-48ec3e257566610d.js",
  "/_next/static/chunks/app/app/minhas-solicitacoes/page-c8cfa6616ee6696d.js",
  "/_next/static/chunks/app/app/page-84ce0e5da223d955.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/4jZT8SCf-ZQzEPBzcpEkw/_buildManifest.js",
  "/_next/static/4jZT8SCf-ZQzEPBzcpEkw/_ssgManifest.js"
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
