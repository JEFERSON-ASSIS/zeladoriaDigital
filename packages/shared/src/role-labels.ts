import type { UserRole } from './types';

/** Nomes exibidos na interface */
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PREFEITURA: 'Prefeitura',
  SECRETARIA: 'Admin secretaria',
  TRIAGEM: 'Triagem',
  EQUIPE_CAMPO: 'Usuário secretaria',
  CIDADAO: 'Cidadão'
};

/** Perfis que o Admin secretaria pode cadastrar na própria unidade */
export const DEPARTMENT_ADMIN_ASSIGNABLE_ROLES: UserRole[] = ['SECRETARIA', 'EQUIPE_CAMPO'];

/** Perfis que podem ser cadastrados pelo administrador geral */
export const ASSIGNABLE_STAFF_ROLES: UserRole[] = [
  'ADMIN',
  'PREFEITURA',
  'SECRETARIA',
  'EQUIPE_CAMPO'
];

/** Perfis exibidos na matriz de permissões de menu */
export const PERMISSION_MATRIX_ROLES: UserRole[] = [
  'ADMIN',
  'PREFEITURA',
  'SECRETARIA',
  'EQUIPE_CAMPO',
  'CIDADAO'
];

export function getRoleLabel(role?: string | null) {
  if (!role) return '—';
  return ROLE_LABELS[role as UserRole] ?? role;
}
