/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-IeSnEUs4nWffH4rQzj-Jp';
const OFFLINE_URL = '/app/offline';

const PRECACHE = [
  "/app/manifest.json",
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
  "/app/offline",
  "/_next/static/chunks/webpack-9af8eb356ac00cc2.js",
  "/_next/static/chunks/1dd3208c-b308dd526aa947ba.js",
  "/_next/static/chunks/1528-e7470f6b2eab7cc0.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/84467045a9b3d8d5.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/8610-66094647289d86a7.js",
  "/_next/static/chunks/app/app/login/page-703e592a45a1aadb.js",
  "/_next/static/chunks/3939-1070b44d1f15b74d.js",
  "/_next/static/chunks/app/app/login/layout-ca88a0206054c1fc.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/2738-18316de5127cf1cb.js",
  "/_next/static/chunks/4155-0abea54b3594a39b.js",
  "/_next/static/chunks/1673-7ab3081601a66264.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-8121f257b9a17507.js",
  "/_next/static/chunks/app/app/(main)/layout-1491b9fae02865dd.js",
  "/_next/static/chunks/2762-9c604d40797ef4ab.js",
  "/_next/static/chunks/244-a58d6b426dee5ee7.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-4d4459f8f2970058.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/140-4801960d8a09f73a.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-dc578c3f95a4f967.js",
  "/_next/static/chunks/app/app/(main)/offline/page-9adb5262094a41f4.js",
  "/_next/static/chunks/7000-9f9ffd122f48b756.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-41550c8568eb1c61.js",
  "/_next/static/chunks/app/app/(main)/saude/page-a941d0128462fdcb.js",
  "/_next/static/chunks/6252-6f175e369d1b43b2.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-8dea6195dac220b5.js",
  "/_next/static/chunks/app/app/(main)/page-6c9b43f80683535b.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-599047048e9d37ae.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-e21a2b7098b3cce1.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-afb45741aa61568b.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-71364478efe11164.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/IeSnEUs4nWffH4rQzj-Jp/_buildManifest.js",
  "/_next/static/IeSnEUs4nWffH4rQzj-Jp/_ssgManifest.js"
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
