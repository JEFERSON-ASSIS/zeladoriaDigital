/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-x8m9xBwWunKTzSDr1nXu5';
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
  "/_next/static/css/c2f07f35c6c55d35.css",
  "/_next/static/chunks/9569-8c09d27428eaddc5.js",
  "/_next/static/chunks/app/layout-54f4578b9876e0eb.js",
  "/_next/static/chunks/2738-18316de5127cf1cb.js",
  "/_next/static/chunks/8134-7a3206c24dcce709.js",
  "/_next/static/chunks/1237-763dbd9fe2f30382.js",
  "/_next/static/chunks/4999-04f3d63d5cb2a23a.js",
  "/_next/static/chunks/7000-ad8b0071cdf3db2e.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-2073ec7faaf1eda1.js",
  "/_next/static/chunks/899-2ab3812cc52ccf0c.js",
  "/_next/static/chunks/app/app/(main)/layout-fcfa872bc6611189.js",
  "/_next/static/chunks/app/app/layout-444e23394a48e8fe.js",
  "/_next/static/chunks/app/app/(main)/login/page-b2ad3853b38a6c86.js",
  "/_next/static/chunks/9837-f42ed1ab74252f8c.js",
  "/_next/static/chunks/140-117a935c3b3ada1a.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-ffa8cf7ca5d69854.js",
  "/_next/static/chunks/6252-b40138431f15b681.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-426d5f143ccf7e9c.js",
  "/_next/static/chunks/app/app/(main)/offline/page-9a37039ed29f512d.js",
  "/_next/static/chunks/app/app/(main)/saude/page-4bad80869187921a.js",
  "/_next/static/chunks/244-b4a571fb93f38273.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-c420184ce28bbe15.js",
  "/_next/static/chunks/1673-304b319d026a23b3.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-72f6583ac7c43d69.js",
  "/_next/static/chunks/app/app/(main)/page-1a811756ad1c84b0.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-4fa68556384f1f8e.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-ae6e2454f3e3e9ae.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-2933a00baf58f5c0.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-a8ff759fd15063fa.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/x8m9xBwWunKTzSDr1nXu5/_buildManifest.js",
  "/_next/static/x8m9xBwWunKTzSDr1nXu5/_ssgManifest.js"
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
