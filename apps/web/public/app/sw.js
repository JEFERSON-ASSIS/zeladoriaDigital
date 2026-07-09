/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-gCivl58eFV1Nrkw5821qP';
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
  "/_next/static/chunks/1dd3208c-b308dd526aa947ba.js",
  "/_next/static/chunks/1528-e7470f6b2eab7cc0.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/25c595b3f16a8e10.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/6340-f3cbc8912d7bac6f.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/8134-9475e5faa51d56cb.js",
  "/_next/static/chunks/4155-46b013d5388636f3.js",
  "/_next/static/chunks/140-24c8c0dea825f52a.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-56cd21ce652a6c79.js",
  "/_next/static/chunks/app/app/(main)/layout-3d1054e40b9886aa.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/2762-8160593af3aac807.js",
  "/_next/static/chunks/7000-6e04c0a46116cc64.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-17a5bb5d0483aaef.js",
  "/_next/static/chunks/1673-5046ee7ca221c433.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-180649366ad8dd9b.js",
  "/_next/static/chunks/app/app/(main)/offline/page-794c262d904422b1.js",
  "/_next/static/chunks/app/app/(main)/saude/page-f3724b75df12230c.js",
  "/_next/static/chunks/244-e10de6a48fd1d126.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-13eccdf21d5376d2.js",
  "/_next/static/chunks/app/app/(main)/page-a03a4395bc114bdf.js",
  "/_next/static/chunks/6252-3f2377fb2c0e308b.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-d915b55340df8630.js",
  "/_next/static/chunks/app/app/(main)/politica-privacidade/page-f9b6470168d56503.js",
  "/_next/static/chunks/app/app/login/page-157a275354a41177.js",
  "/_next/static/chunks/app/app/login/layout-3b4182628a443de8.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-5a4c65bcbff4edce.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-d378428a3cebf739.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-9d6e09cffb0c8bd7.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-5bab4d3de4c18e0e.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/gCivl58eFV1Nrkw5821qP/_buildManifest.js",
  "/_next/static/gCivl58eFV1Nrkw5821qP/_ssgManifest.js"
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
