import type { MenuKey } from '@zeladoria/shared';
import {
  CITIZEN_PWA_MODULES,
  resolveCitizenPwaHomeRoute,
  resolveCitizenPwaModules
} from '@zeladoria/shared';
import { fetchCurrentUser } from './auth-api';
import { fetchMyMenuPermissions } from './permissions-api';
import type { AuthSession, AuthUser } from './auth';
import { setSession } from './auth';
import { isCitizenHealthPath } from './citizen-nav';
import { parsePsfIdFromPath, unitPath } from './psf-unit';
import { PWA_LOGIN, pwaPath } from './pwa';

export function resolveCitizenPwaHome(menuKeys?: MenuKey[] | null) {
  const route = resolveCitizenPwaHomeRoute(menuKeys);
  return route ? pwaPath(route) : PWA_LOGIN;
}

export function getMenuKeyForPwaPath(pathname: string): MenuKey | null {
  if (pathname === pwaPath('/saude') || pathname.startsWith(`${pwaPath('/saude')}/`)) {
    return 'agendamento';
  }

  for (const module of CITIZEN_PWA_MODULES) {
    const fullPath = pwaPath(module.route);
    if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
      return module.key;
    }
  }
  return null;
}

export function canAccessCitizenPwaPath(pathname: string, menuKeys?: MenuKey[] | null) {
  const unitId = parsePsfIdFromPath(pathname);
  if (unitId) {
    if (menuKeys == null) return false;
    const allowed = new Set(menuKeys);
    if (pathname === unitPath(unitId) || pathname === `${unitPath(unitId)}/`) {
      return allowed.has('inicio') || allowed.has('agendamento') || allowed.has('meus-agendamentos');
    }
    if (pathname.includes('/agendamento')) return allowed.has('agendamento');
    if (pathname.includes('/meus-agendamentos')) return allowed.has('meus-agendamentos');
    return false;
  }

  if (isCitizenHealthPath(pathname)) {
    if (menuKeys == null) return false;
    return menuKeys.includes('agendamento') || menuKeys.includes('meus-agendamentos');
  }

  const menuKey = getMenuKeyForPwaPath(pathname);
  if (!menuKey) return true;
  if (menuKeys == null) return false;
  return resolveCitizenPwaModules(menuKeys).some((module) => module.key === menuKey);
}

export { resolveCitizenPwaModules };

export async function loadCitizenMenuKeys(accessToken: string): Promise<MenuKey[]> {
  try {
    const user = await fetchCurrentUser(accessToken);
    if (user.menuKeys != null) {
      return user.menuKeys;
    }
  } catch {
    // Tenta endpoint dedicado abaixo.
  }

  return fetchMyMenuPermissions(accessToken);
}

export async function refreshCitizenSession(accessToken: string, user: AuthUser): Promise<AuthSession> {
  let nextUser = user;

  try {
    const fresh = await fetchCurrentUser(accessToken);
    nextUser = { ...user, ...fresh, menuKeys: fresh.menuKeys ?? user.menuKeys };
  } catch {
    try {
      const menuKeys = await fetchMyMenuPermissions(accessToken);
      nextUser = { ...user, menuKeys };
    } catch {
      // Mantém usuário informado pelo login.
    }
  }

  const session: AuthSession = {
    accessToken,
    user: nextUser
  };
  setSession(session);
  return session;
}
