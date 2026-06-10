export type SessionRole = 'ADMIN' | 'PREFEITURA' | 'SECRETARIA' | 'TRIAGEM' | 'EQUIPE_CAMPO' | 'CIDADAO';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: SessionRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export const ROLE_NAVIGATION: Record<SessionRole, string[]> = {
  ADMIN: ['Dashboard', 'Ocorrências', 'Ordens de serviço', 'Mapa', 'Relatórios', 'Usuários'],
  PREFEITURA: ['Dashboard', 'Ocorrências', 'Ordens de serviço', 'Mapa', 'Relatórios'],
  SECRETARIA: ['Dashboard', 'Ocorrências', 'Ordens de serviço', 'Mapa'],
  TRIAGEM: ['Dashboard', 'Ocorrências', 'Ordens de serviço'],
  EQUIPE_CAMPO: ['Dashboard', 'Ordens de serviço'],
  CIDADAO: ['Dashboard', 'Nova ocorrência', 'Minhas solicitações']
};

const SESSION_KEY = 'zeladoria.session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getNavigationForRole(role?: SessionRole | null) {
  if (!role) return [];
  return ROLE_NAVIGATION[role] ?? [];
}

export function getNavigationHref(label: string) {
  switch (label) {
    case 'Dashboard':
      return '/';
    case 'Ocorrências':
      return '/ocorrencias';
    case 'Ordens de serviço':
      return '/ordens-servico';
    case 'Nova ocorrência':
      return '/nova-ocorrencia';
    case 'Minhas solicitações':
      return '/minhas-solicitacoes';
    default:
      return '#';
  }
}
