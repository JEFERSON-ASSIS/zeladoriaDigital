'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '../lib/auth';
import {
  canAccessCitizenPwaPath,
  refreshCitizenSession,
  resolveCitizenPwaHome,
  shouldRedirectBoundCitizen
} from '../lib/citizen-pwa-access';
import { buildPwaLoginUrl, PWA_LOGIN, PWA_PRIVACY_POLICY } from '../lib/pwa';

const PUBLIC_PWA_PATHS = new Set([PWA_LOGIN, PWA_PRIVACY_POLICY, '/app/offline', '/app']);

export function CitizenPwaRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (PUBLIC_PWA_PATHS.has(pathname)) return;

    const session = getSession();
    if (!session || session.user.role !== 'CIDADAO') {
      router.replace(buildPwaLoginUrl(pathname));
      return;
    }

    let cancelled = false;

    async function syncAccess() {
      try {
        const nextSession = await refreshCitizenSession(session!.accessToken, session!.user);
        if (cancelled) return;

        const menuKeys = nextSession.user.menuKeys;
        if (menuKeys == null) return;

        const unitRedirect = shouldRedirectBoundCitizen(pathname, nextSession.user.healthUnitPsfId);
        if (unitRedirect) {
          router.replace(unitRedirect);
          return;
        }

        if (!canAccessCitizenPwaPath(pathname, menuKeys)) {
          router.replace(resolveCitizenPwaHome(menuKeys, nextSession.user.healthUnitPsfId));
        }
      } catch {
        if (cancelled) return;
        const menuKeys = session!.user.menuKeys;
        if (menuKeys == null) return;

        const unitRedirect = shouldRedirectBoundCitizen(pathname, session!.user.healthUnitPsfId);
        if (unitRedirect) {
          router.replace(unitRedirect);
          return;
        }

        if (!canAccessCitizenPwaPath(pathname, menuKeys)) {
          router.replace(resolveCitizenPwaHome(menuKeys, session!.user.healthUnitPsfId));
        }
      }
    }

    void syncAccess();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return children;
}
