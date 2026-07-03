/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-Bfu3boB7lqNQA3Q3eeIJp';
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
  "/_next/static/chunks/2738-18316de5127cf1cb.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/8610-22bf1d0ec3ffe33d.js",
  "/_next/static/chunks/8866-31bcf34e06087f07.js",
  "/_next/static/chunks/140-acd7397de0f57c0b.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-8e2febe7a53ca00f.js",
  "/_next/static/chunks/3939-e970df2e3f225dc4.js",
  "/_next/static/chunks/app/app/(main)/layout-97d41d9e43c3a2b4.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/3832-fd25a389e2c2dacf.js",
  "/_next/static/chunks/7000-17184f3a939ff0f5.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-ad7db7f384ee27ff.js",
  "/_next/static/chunks/1673-f1a2448e8929eb52.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-058e8c9843950040.js",
  "/_next/static/chunks/6252-c3e8ee10b3984e6d.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-dacb678daca76039.js",
  "/_next/static/chunks/app/app/(main)/offline/page-a1dfc15816f0972c.js",
  "/_next/static/chunks/app/app/(main)/saude/page-03c5c51d39b2a9be.js",
  "/_next/static/chunks/244-a7318909d4ac30d2.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-68f5c6cfec6ea969.js",
  "/_next/static/chunks/app/app/(main)/page-4b2035db0b5922dd.js",
  "/_next/static/chunks/app/app/login/page-517caaefb07bb74b.js",
  "/_next/static/chunks/app/app/login/layout-51125cb8a39db5dd.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-8519164a6d9d0577.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-c7b0559e0d50fb8b.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-fb2ebf963a329951.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-c3b96383f013d374.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/Bfu3boB7lqNQA3Q3eeIJp/_buildManifest.js",
  "/_next/static/Bfu3boB7lqNQA3Q3eeIJp/_ssgManifest.js"
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
