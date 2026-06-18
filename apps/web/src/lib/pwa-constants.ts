export const PWA_SCOPE = '/app';
export const PWA_SW_URL = '/app/sw.js';
export const PWA_MANIFEST_URL = '/app/manifest.json';
export const PWA_LOGIN = '/app/login';
export const PWA_HOME = '/app/nova-ocorrencia';

export const PWA_CITIZEN_ROUTES = [
  '/nova-ocorrencia',
  '/minhas-solicitacoes',
  '/agendamento',
  '/meus-agendamentos'
] as const;

export function pwaPath(route: string) {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  return `${PWA_SCOPE}${normalized}`;
}
