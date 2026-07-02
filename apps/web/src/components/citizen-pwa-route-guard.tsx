'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '../lib/auth';
import {
  canAccessCitizenPwaPath,
  refreshCitizenSession,
  resolveCitizenPwaHome
} from '../lib/citizen-pwa-access';
import { PWA_LOGIN } from '../lib/pwa';
import { isUnitPwaPath } from '../lib/psf-unit';

const PUBLIC_PWA_PATHS = new Set([PWA_LOGIN, '/app/offline', '/app']);

export function CitizenPwaRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (PUBLIC_PWA_PATHS.has(pathname)) return;
    if (isUnitPwaPath(pathname)) return;

    const session = getSession();
    if (!session || session.user.role !== 'CIDADAO') return;

    let cancelled = false;

    async function syncAccess() {
      try {
        const nextSession = await refreshCitizenSession(session!.accessToken, session!.user);
        if (cancelled) return;

        const menuKeys = nextSession.user.menuKeys;
        if (menuKeys == null) return;

        if (!canAccessCitizenPwaPath(pathname, menuKeys)) {
          router.replace(resolveCitizenPwaHome(menuKeys));
        }
      } catch {
        if (cancelled) return;
        const menuKeys = session!.user.menuKeys;
        if (menuKeys == null) return;
        if (!canAccessCitizenPwaPath(pathname, menuKeys)) {
          router.replace(resolveCitizenPwaHome(menuKeys));
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
