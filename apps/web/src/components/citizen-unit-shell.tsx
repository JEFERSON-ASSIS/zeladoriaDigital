'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { CitizenConfirmDialog } from './citizen-confirm-dialog';
import { BrandMark } from './brand-logo';
import { usePsfUnit } from './psf-unit-provider';
import { clearSession } from '../lib/auth';
import { buildPwaLoginUrl } from '../lib/pwa';

type CitizenUnitShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const UNIT_NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
} as const;

export function CitizenUnitShell({ children, title, subtitle }: CitizenUnitShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unit = usePsfUnit();
  const [logoutOpen, setLogoutOpen] = useState(false);

  if (!unit) return null;

  const activeUnit = unit;

  const navItems = [
    { href: activeUnit.path(), label: 'Início', icon: UNIT_NAV_ICONS.home, match: (path: string) => path === activeUnit.basePath },
    {
      href: activeUnit.path('/agendamento'),
      label: 'Agendar',
      icon: UNIT_NAV_ICONS.schedule,
      match: (path: string) => path.includes('/agendamento')
    },
    {
      href: activeUnit.path('/meus-agendamentos'),
      label: 'Consultas',
      icon: UNIT_NAV_ICONS.list,
      match: (path: string) => path.includes('/meus-agendamentos')
    }
  ];

  function confirmLogout() {
    clearSession();
    setLogoutOpen(false);
    router.push(buildPwaLoginUrl(activeUnit.path('/agendamento')));
  }

  return (
    <div className="citizen-app citizen-app--native citizen-app--unit">
      <header className="citizen-app__header">
        <div className="citizen-app__header-left">
          <BrandMark size="sm" className="citizen-app__mark" />
        </div>
        <h2 className="citizen-app__header-title">{title ?? activeUnit.psf.label}</h2>
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
        {children}
      </main>

      <nav
        className="citizen-app__nav"
        aria-label={`Navegação ${activeUnit.psf.label}`}
        data-nav-count={navItems.length}
        style={{ '--citizen-nav-count': navItems.length } as React.CSSProperties}
      >
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`citizen-app__nav-link${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="citizen-app__nav-icon-wrapper">
                <span className="citizen-app__nav-pill" />
                <span className="citizen-app__nav-icon">{item.icon}</span>
              </span>
              <span className="citizen-app__nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

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
