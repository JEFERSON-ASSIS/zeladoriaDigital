/* Gerado em build — não edite sw.js diretamente; use sw.template.js */
const CACHE_VERSION = 'prefeitura-pwa-YVrPC_N9rr0kqZMEMSQNp';
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
  "/_next/static/chunks/1dd3208c-4526bc50a90d281e.js",
  "/_next/static/chunks/1528-7bc95a8e56330ee2.js",
  "/_next/static/chunks/main-app-8dd60d56dadc17db.js",
  "/_next/static/css/3add334ee59f67ac.css",
  "/_next/static/css/e2e0ccfaddab5d02.css",
  "/_next/static/chunks/9569-9a6c5cf709dffd76.js",
  "/_next/static/chunks/app/layout-bda80d47962bf85d.js",
  "/_next/static/chunks/6340-f76583ab98bd68f9.js",
  "/_next/static/chunks/5014-64432e6567a5ef97.js",
  "/_next/static/chunks/3041-4170578c43dabf31.js",
  "/_next/static/chunks/4155-32ed845f89fa88b2.js",
  "/_next/static/chunks/app/app/(main)/conversas/page-faed4d519bb0dba7.js",
  "/_next/static/chunks/app/app/(main)/layout-d767123fe5fe0b65.js",
  "/_next/static/chunks/app/app/layout-2dd1c3c33d69a8bb.js",
  "/_next/static/chunks/5118-26dd0c02a3566adb.js",
  "/_next/static/chunks/6601-91f3bc25fd1a2930.js",
  "/_next/static/chunks/app/app/(main)/nova-ocorrencia/page-dd2f9fc0324417e9.js",
  "/_next/static/chunks/1673-5de5a95b504b7a10.js",
  "/_next/static/chunks/app/app/(main)/inicio/page-c3cc6a1d5a192d24.js",
  "/_next/static/chunks/2000-ada2841f57f6e9e3.js",
  "/_next/static/chunks/1821-f98986a49de80438.js",
  "/_next/static/chunks/app/app/(main)/agendamento/page-b325296a7e438d5d.js",
  "/_next/static/chunks/9935-683a45d283e1d663.js",
  "/_next/static/chunks/app/app/(main)/minhas-solicitacoes/page-ad300004e5ed6ed1.js",
  "/_next/static/chunks/app/app/(main)/offline/page-d8330091ea93ce24.js",
  "/_next/static/chunks/app/app/(main)/page-750e7d70f99ac362.js",
  "/_next/static/chunks/app/app/(main)/saude/page-6749c048b7dd8361.js",
  "/_next/static/chunks/7000-c41a8eb292a58e09.js",
  "/_next/static/chunks/app/app/(main)/meus-agendamentos/page-3e4858164b7c1bc7.js",
  "/_next/static/chunks/app/app/(main)/politica-privacidade/page-f9b6470168d56503.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/agendamento/page-dc4e480fd436324c.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/layout-f1404d1c0f609094.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/meus-agendamentos/page-b6a667e16f779e9c.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/page-4ce97a94d5119148.js",
  "/_next/static/chunks/app/app/unidade/[psfId]/conversas/page-a730f1614f2f760c.js",
  "/_next/static/chunks/app/app/login/page-3651300bf6e7e87a.js",
  "/_next/static/chunks/app/app/login/layout-2213b4bb16dc08aa.js",
  "/_next/static/chunks/polyfills-42372ed130431b0a.js",
  "/_next/static/YVrPC_N9rr0kqZMEMSQNp/_buildManifest.js",
  "/_next/static/YVrPC_N9rr0kqZMEMSQNp/_ssgManifest.js"
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
    tag: payload.tag ?? 'prefeitura-na-mao',
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
