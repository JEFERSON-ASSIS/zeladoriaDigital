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
  ADMIN: ['Painel', 'Ocorrencias', 'Ordens de servico', 'Mapa', 'Relatorios', 'Usuarios'],
  PREFEITURA: ['Painel', 'Ocorrencias', 'Ordens de servico', 'Mapa', 'Relatorios'],
  SECRETARIA: ['Painel', 'Ocorrencias', 'Ordens de servico', 'Mapa'],
  TRIAGEM: ['Painel', 'Ocorrencias', 'Ordens de servico'],
  EQUIPE_CAMPO: ['Painel', 'Ordens de servico'],
  CIDADAO: ['Painel', 'Nova ocorrencia', 'Minhas solicitacoes']
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
    case 'Painel':
      return '/';
    case 'Ocorrencias':
      return '/ocorrencias';
    case 'Ordens de servico':
      return '/ordens-servico';
    case 'Mapa':
      return '/admin/maps/executive';
    case 'Relatorios':
      return '/admin/reports';
    case 'Usuarios':
      return '/admin/users';
    case 'Nova ocorrencia':
      return '/nova-ocorrencia';
    case 'Minhas solicitacoes':
      return '/minhas-solicitacoes';
    default:
      return '#';
  }
}
