export const PWA_SCOPE = '/app';
export const PWA_SW_URL = '/app/sw.js';
export const PWA_MANIFEST_URL = '/app/manifest.json';
export const PWA_LOGIN = '/app/login';
export const PWA_HOME = '/app/nova-ocorrencia';

export const PWA_CITIZEN_ROUTES = [
  '/inicio',
  '/nova-ocorrencia',
  '/minhas-solicitacoes',
  '/saude',
  '/agendamento',
  '/meus-agendamentos',
  '/unidade'
] as const;

export const PWA_BROWSER_MODE_KEY = 'zeladoria.pwa.browserMode';

export function pwaPath(route: string) {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${PWA_SCOPE}${normalized}`;
}

export function buildPwaLoginUrl(returnPath?: string) {
  if (!returnPath || !returnPath.startsWith(PWA_SCOPE)) return PWA_LOGIN;
  return `${PWA_LOGIN}?return=${encodeURIComponent(returnPath)}`;
}

const UNIT_PWA_PATH_RE = /^\/app\/unidade\/psf[123](?:\/|$)/;

export function shouldSkipPwaInstallGate(pathname: string, search = '') {
  if (UNIT_PWA_PATH_RE.test(pathname)) return true;
  if (pathname === PWA_LOGIN || pathname === '/app/offline') return true;

  if (search) {
    const returnPath = new URLSearchParams(search).get('return');
    if (returnPath && UNIT_PWA_PATH_RE.test(returnPath)) return true;
  }

  return false;
}
