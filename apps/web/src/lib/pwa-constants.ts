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

export function shouldSkipPwaInstallGate(pathname: string) {
  return pathname === '/app/offline';
}

/** Login e landing de unidade: sempre mostrar tela de instalação até abrir como app instalado. */
export function isPwaEntryRoute(pathname: string) {
  if (pathname === PWA_LOGIN) return true;
  return /^\/app\/unidade\/psf[123]\/?$/.test(pathname);
}
