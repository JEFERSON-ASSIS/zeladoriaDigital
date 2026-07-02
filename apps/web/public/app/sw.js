/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-7-ys7hqO-TZEgiBtyBzbb';
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
  "/_next/static/chunks/1dd3208c-541cde9cc2d4d3e7.js",
  "/_next/static/chunks/1528-f3028d4734ddd441.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/7998069731727d99.css",
  "/_next/static/chunks/9569-cca5198bb43a52dd.js",
  "/_next/static/chunks/app/layout-d3beed2c4749bb3a.js",
  "/_next/static/chunks/2738-3448c60fe85aa1b1.js",
  "/_next/static/chunks/8610-1a8f3ce1c36a5964.js",
  "/_next/static/chunks/1237-3fd8ff6920767e86.js",
  "/_next/static/chunks/5345-801d2feb28721316.js",
  "/_next/static/chunks/244-5b42f4809cc88fd7.js",
  "/_next/static/chunks/app/app/agendamento/page-e9940e2f928b9ea5.js",
  "/_next/static/chunks/app/app/layout-a739792c9388bbb1.js",
  "/_next/static/chunks/app/app/login/page-f3d06df763f83dae.js",
  "/_next/static/chunks/7000-7592570bb5cab1dd.js",
  "/_next/static/chunks/app/app/meus-agendamentos/page-92ff6ae3cbd53d31.js",
  "/_next/static/chunks/9837-f42ed1ab74252f8c.js",
  "/_next/static/chunks/140-4143fda34b5b9e44.js",
  "/_next/static/chunks/app/app/minhas-solicitacoes/page-58b63e4c3b5f4c9f.js",
  "/_next/static/chunks/app/app/page-303bb338db236adb.js",
  "/_next/static/chunks/app/app/offline/page-4f7d416a4eb276bb.js",
  "/_next/static/chunks/6252-f5124d74001eb583.js",
  "/_next/static/chunks/app/app/nova-ocorrencia/page-754419b9195f2edb.js",
  "/_next/static/chunks/app/app/saude/page-3dead955a7c38223.js",
  "/_next/static/chunks/1673-41c49c70bc83348c.js",
  "/_next/static/chunks/app/app/inicio/page-e131392d827953bc.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-3751dc920e9bfd00.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-94221067aa4af62c.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-d17454ff2fa522b1.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-fa98b3b065c0ceda.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/7-ys7hqO-TZEgiBtyBzbb/_buildManifest.js",
  "/_next/static/7-ys7hqO-TZEgiBtyBzbb/_ssgManifest.js"
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
