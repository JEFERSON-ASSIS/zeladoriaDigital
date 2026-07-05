/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-F7Sb4e3CMNtP6XP1Ctn6m';
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
  "/app/unidade/psf1/meus-agendamentos",
  "/app/unidade/psf2/meus-agendamentos",
  "/app/unidade/psf3/meus-agendamentos",
  "/app/offline",
  "/_next/static/chunks/webpack-9af8eb356ac00cc2.js",
  "/_next/static/chunks/1dd3208c-b308dd526aa947ba.js",
  "/_next/static/chunks/1528-e7470f6b2eab7cc0.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/84467045a9b3d8d5.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/8610-021d635e15b06bce.js",
  "/_next/static/chunks/app/app/login/page-75f5b71a6234dbf6.js",
  "/_next/static/chunks/3939-1070b44d1f15b74d.js",
  "/_next/static/chunks/app/app/login/layout-5e1ce96f06546cb6.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/2738-18316de5127cf1cb.js",
  "/_next/static/chunks/4155-998576e8125f73d4.js",
  "/_next/static/chunks/2762-233cace610b70c24.js",
  "/_next/static/chunks/244-55a752a5cc134b62.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-4d4459f8f2970058.js",
  "/_next/static/chunks/app/app/(main)/layout-97d41d9e43c3a2b4.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/6252-6f175e369d1b43b2.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-8dea6195dac220b5.js",
  "/_next/static/chunks/app/app/(main)/page-18f00633d97f182f.js",
  "/_next/static/chunks/1673-9c7f8ef0aaf03c62.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-b718c6abd25a2f4f.js",
  "/_next/static/chunks/app/app/(main)/saude/page-e0602b4ce122e874.js",
  "/_next/static/chunks/7000-6174498c770d68ac.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-41550c8568eb1c61.js",
  "/_next/static/chunks/app/app/(main)/offline/page-9adb5262094a41f4.js",
  "/_next/static/chunks/140-4801960d8a09f73a.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-dc578c3f95a4f967.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-71364478efe11164.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-a8140b9e5ec77a10.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-9b41bb964cfb0baf.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-afb45741aa61568b.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/F7Sb4e3CMNtP6XP1Ctn6m/_buildManifest.js",
  "/_next/static/F7Sb4e3CMNtP6XP1Ctn6m/_ssgManifest.js"
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
