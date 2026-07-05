/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-7o8_9YWEwOSJ_1kdOMreS';
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
  "/_next/static/css/400e1e593f25656b.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/6340-f3cbc8912d7bac6f.js",
  "/_next/static/chunks/3041-ac4241f904862e25.js",
  "/_next/static/chunks/4155-f1fbf8a5cc66f0a1.js",
  "/_next/static/chunks/2762-8160593af3aac807.js",
  "/_next/static/chunks/244-a8e5cf39fc84c016.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-db45062e9767c6a2.js",
  "/_next/static/chunks/3939-f9bb3855dbd61e4d.js",
  "/_next/static/chunks/app/app/(main)/layout-a9e4cbf50fc229e5.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/7000-d0a41d5bebc544b5.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-35f5e709089f4426.js",
  "/_next/static/chunks/app/app/(main)/saude/page-2f1e6cd050cf5fee.js",
  "/_next/static/chunks/app/app/(main)/offline/page-99c219c6b2ef9933.js",
  "/_next/static/chunks/app/app/(main)/page-dadea1f32881504a.js",
  "/_next/static/chunks/app/app/(main)/politica-privacidade/page-f9b6470168d56503.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/6252-77acd13a261884ea.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-bf69edc0e92728e6.js",
  "/_next/static/chunks/1673-6ab50f50dd569e48.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-c3cc6a1d5a192d24.js",
  "/_next/static/chunks/140-92d07e0ab281ced7.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-bcc97f0c213f3e7b.js",
  "/_next/static/chunks/app/app/login/page-f1b7bff1492f555b.js",
  "/_next/static/chunks/app/app/login/layout-eb708ab90dccb868.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-4ce97a94d5119148.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-e1ebe3618f4789ab.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-a21b62a901f2c789.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-300a207a39dd9db3.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/7o8_9YWEwOSJ_1kdOMreS/_buildManifest.js",
  "/_next/static/7o8_9YWEwOSJ_1kdOMreS/_ssgManifest.js"
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
