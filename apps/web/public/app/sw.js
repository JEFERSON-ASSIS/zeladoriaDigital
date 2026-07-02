/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-yNNdY9OFlaiA7yJfFrI0x';
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
  "/_next/static/chunks/1528-b426becd6314ff97.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/4b7d88df9c392747.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/8610-dfb3254acbd1139c.js",
  "/_next/static/chunks/app/app/login/page-34f41758e1c2724a.js",
  "/_next/static/chunks/app/app/login/layout-a405a930709b42b1.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/2738-18316de5127cf1cb.js",
  "/_next/static/chunks/8866-bd56339eb4a8c0f4.js",
  "/_next/static/chunks/4114-851e6adaae1e7967.js",
  "/_next/static/chunks/7000-d856dbcd7bec7b93.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-5ce8a57f46667f82.js",
  "/_next/static/chunks/app/app/(main)/layout-559adff59f43166b.js",
  "/_next/static/chunks/1673-71f0a2a8b23d1d15.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-058e8c9843950040.js",
  "/_next/static/chunks/244-d60dcf59c394f21d.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-516103e55ecaeb96.js",
  "/_next/static/chunks/9837-f42ed1ab74252f8c.js",
  "/_next/static/chunks/140-d392322960630764.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-367580fc1c21cc90.js",
  "/_next/static/chunks/app/app/(main)/saude/page-941fabdbd7e79a07.js",
  "/_next/static/chunks/6252-9fa3a22e8cac659a.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-aa334b7a7c466af9.js",
  "/_next/static/chunks/app/app/(main)/page-38a4102c51db4d8e.js",
  "/_next/static/chunks/app/app/(main)/offline/page-d6dbd9d2317dbd34.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-d4e9f179d08282ca.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-c327d5d601c6c175.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-4d5bae792052617b.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-2f2ae32596582587.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/yNNdY9OFlaiA7yJfFrI0x/_buildManifest.js",
  "/_next/static/yNNdY9OFlaiA7yJfFrI0x/_ssgManifest.js"
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
