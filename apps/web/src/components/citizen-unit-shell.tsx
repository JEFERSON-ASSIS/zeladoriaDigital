'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { MenuKey } from '@zeladoria/shared';
import { CitizenConfirmDialog } from './citizen-confirm-dialog';
import { BrandMark } from './brand-logo';
import { UnitInstallHint } from './unit-install-hint';
import { CITIZEN_PWA_NAV_ICONS } from './citizen-pwa-nav-icons';
import { usePsfUnit } from './psf-unit-provider';
import { clearSession, getSession } from '../lib/auth';
import { refreshCitizenSession } from '../lib/citizen-pwa-access';
import { isNavPathActive, resolveCitizenUnitNavItems } from '../lib/citizen-nav';
import { buildPwaLoginUrl } from '../lib/pwa';
import { CitizenPageSkeleton } from './citizen-page-skeleton';

type CitizenUnitShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function CitizenUnitShell({ children, title, subtitle }: CitizenUnitShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unit = usePsfUnit();
  const [menuKeys, setMenuKeys] = useState<MenuKey[] | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session || session.user.role !== 'CIDADAO') return;

    let cancelled = false;

    refreshCitizenSession(session.accessToken, session.user)
      .then((nextSession) => {
        if (cancelled) return;
        setMenuKeys(nextSession.user.menuKeys ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setMenuKeys(session.user.menuKeys ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(() => {
    if (!unit || menuKeys == null) return [];
    return resolveCitizenUnitNavItems(unit, menuKeys);
  }, [menuKeys, unit]);

  function confirmLogout() {
    if (!unit) return;
    clearSession();
    setLogoutOpen(false);
    router.push(buildPwaLoginUrl(unit.path()));
  }

  if (!unit) return null;

  if (menuKeys == null) {
    return (
      <div className="citizen-app citizen-app--native citizen-app--unit">
        <CitizenPageSkeleton variant="list" />
      </div>
    );
  }

  return (
    <div className="citizen-app citizen-app--native citizen-app--unit">
      <header className="citizen-app__header">
        <div className="citizen-app__header-left">
          <BrandMark size="sm" className="citizen-app__mark" />
        </div>
        <h2 className="citizen-app__header-title">{title ?? unit.psf.label}</h2>
        <button type="button" className="citizen-app__logout" onClick={() => setLogoutOpen(true)} aria-label="Sair">
          Sair
        </button>
      </header>

      <main className="citizen-app__content">
        {subtitle ? (
          <section className="citizen-app__intro">
            <p>{subtitle}</p>
          </section>
        ) : null}
        <UnitInstallHint unitLabel={unit.psf.label} />
        {children}
      </main>

      {navItems.length > 0 ? (
        <nav
          className="citizen-app__nav"
          aria-label={`Navegação ${unit.psf.label}`}
          data-nav-count={navItems.length}
          style={{ '--citizen-nav-count': navItems.length } as React.CSSProperties}
        >
          {navItems.map((item) => {
            const isActive = isNavPathActive(pathname, item.matchPaths);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`citizen-app__nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="citizen-app__nav-icon-wrapper">
                  <span className="citizen-app__nav-pill" />
                  <span className="citizen-app__nav-icon">{CITIZEN_PWA_NAV_ICONS[item.iconKey]}</span>
                </span>
                <span className="citizen-app__nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      <CitizenConfirmDialog
        open={logoutOpen}
        title="Sair do aplicativo?"
        description="Você precisará informar seu celular novamente para entrar."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onConfirm={confirmLogout}
        onClose={() => setLogoutOpen(false)}
      />
    </div>
  );
}
