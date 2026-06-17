import type { SessionRole } from './auth';
import { DEFAULT_ROLE_MENU_KEYS, MENU_CATALOG, type MenuKey } from '@zeladoria/shared';

export type NavEntry = {
  key: MenuKey;
  label: string;
  href: string;
  roles: SessionRole[];
};

/** Menu único da plataforma — filtrado por perfil e permissões configuráveis */
export const APP_NAVIGATION: NavEntry[] = MENU_CATALOG.map((item) => ({
  key: item.key,
  label: item.label,
  href: item.href,
  roles: (Object.entries(DEFAULT_ROLE_MENU_KEYS) as [SessionRole, MenuKey[]][])
    .filter(([, keys]) => keys.includes(item.key))
    .map(([role]) => role)
}));

function resolveNavigationRole(role: SessionRole): keyof typeof DEFAULT_ROLE_MENU_KEYS {
  if (role === 'TRIAGEM') return 'PREFEITURA';
  return role as keyof typeof DEFAULT_ROLE_MENU_KEYS;
}

export function getNavigationItems(role?: SessionRole | null, menuKeys?: MenuKey[] | null) {
  if (!role) return [];

  const navigationRole = resolveNavigationRole(role);
  const allowedKeys = menuKeys?.length
    ? new Set(menuKeys)
    : new Set(DEFAULT_ROLE_MENU_KEYS[navigationRole] ?? []);

  return APP_NAVIGATION.filter(
    (item) =>
      (item.roles.includes(role) || (role === 'TRIAGEM' && item.roles.includes('PREFEITURA'))) &&
      allowedKeys.has(item.key)
  ).map(({ label, href }) => ({
    label,
    href
  }));
}

export function canAccessPath(pathname: string, role?: SessionRole | null, menuKeys?: MenuKey[] | null) {
  if (!role) return false;
  const items = getNavigationItems(role, menuKeys);
  return items.some((item) => isNavItemActive(pathname, item.href));
}

export function getNavigationForRole(role?: SessionRole | null, menuKeys?: MenuKey[] | null) {
  return getNavigationItems(role, menuKeys).map((item) => item.label);
}

export function getNavigationHref(label: string) {
  const entry = APP_NAVIGATION.find((item) => item.label === label);
  return entry?.href ?? '#';
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/admin/maps/executive') {
    return pathname.startsWith('/admin/maps');
  }
  if (href === '/admin/dashboard/executivo') {
    return pathname.startsWith('/admin/dashboard') || pathname.startsWith('/admin/executive-dashboard');
  }
  if (href === '/admin/permissoes') {
    return pathname.startsWith('/admin/permissoes');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Secretarias municipais cadastradas no sistema */
export const MUNICIPAL_DEPARTMENTS = [
  'Secretaria Municipal de Agricultura, Meio Ambiente e Desenvolvimento Econômico',
  'Secretaria Municipal de Desenvolvimento Social e Cidadania',
  'Secretaria Municipal de Educação',
  'Secretaria Municipal de Esporte, Cultura, Turismo e Juventude',
  'Secretaria Municipal de Fazenda e Planejamento',
  'Secretaria Municipal de Gestão',
  'Secretaria Municipal de Obras e Serviços',
  'Secretaria Municipal de Saúde'
] as const;
