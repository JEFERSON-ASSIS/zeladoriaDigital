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
import { PWA_LOGIN, pwaPath } from './pwa';

export function resolveCitizenPwaHome(menuKeys?: MenuKey[] | null) {
  const route = resolveCitizenPwaHomeRoute(menuKeys);
  return route ? pwaPath(route) : PWA_LOGIN;
}

export function getMenuKeyForPwaPath(pathname: string): MenuKey | null {
  for (const module of CITIZEN_PWA_MODULES) {
    const fullPath = pwaPath(module.route);
    if (pathname === fullPath || pathname.startsWith(`${fullPath}/`)) {
      return module.key;
    }
  }
  return null;
}

export function canAccessCitizenPwaPath(pathname: string, menuKeys?: MenuKey[] | null) {
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
  const menuKeys = await loadCitizenMenuKeys(accessToken);
  const session: AuthSession = {
    accessToken,
    user: { ...user, menuKeys }
  };
  setSession(session);
  return session;
}
