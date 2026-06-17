'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { clearSession, getSession, setSession, type AuthSession } from '../lib/auth';
import { canAccessPath, getNavigationItems } from '../lib/navigation';
import { fetchCurrentUser } from '../lib/auth-api';

export function SidebarShell() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<AuthSession | null>(null);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace('/login');
      return;
    }

    fetchCurrentUser(current.accessToken)
      .then((user) => {
        const nextSession = { ...current, user };
        setSession(nextSession);
        setSessionState(nextSession);
      })
      .catch(() => setSessionState(current));
  }, [router]);

  const items = useMemo(
    () => getNavigationItems(session?.user.role, session?.user.menuKeys),
    [session]
  );

  useEffect(() => {
    if (!session?.user.role) return;
    if (pathname.startsWith('/login')) return;
    if (!canAccessPath(pathname, session.user.role, session.user.menuKeys)) {
      router.replace('/');
    }
  }, [pathname, router, session]);

  function logout() {
    clearSession();
    router.push('/login');
  }

  return (
    <AppSidebar
      items={items}
      userName={session?.user.name}
      userRole={session?.user.role}
      departmentName={session?.user.department?.name}
      onLogout={logout}
    />
  );
}
