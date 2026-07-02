'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { MenuKey } from '@zeladoria/shared';
import { clearSession, getSession } from '../lib/auth';
import { refreshCitizenSession } from '../lib/citizen-pwa-access';
import { resolveCitizenNavItems } from '../lib/citizen-nav';
import { PWA_LOGIN } from '../lib/pwa';
import { BrandMark } from './brand-logo';
import { CitizenConfirmDialog } from './citizen-confirm-dialog';
import { CitizenPageSkeleton } from './citizen-page-skeleton';

type CitizenShellProps = {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  loadingVariant?: 'feed' | 'form' | 'list';
};

const NAV_ICONS: Record<MenuKey | 'saude', React.ReactNode> = {
  painel: null,
  ocorrencias: null,
  'ordens-servico': null,
  'painel-executivo': null,
  indicadores: null,
  ranking: null,
  relatorios: null,
  alertas: null,
  mapas: null,
  configuracoes: null,
  secretarias: null,
  usuarios: null,
  permissoes: null,
  transparencia: null,
  'avisos-app': null,
  'cidadaos-saude': null,
  saude: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  inicio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 10.5L12 4l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  ),
  'nova-ocorrencia': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  'minhas-solicitacoes': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  ),
  agendamento: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="3" />
    </svg>
  ),
  'meus-agendamentos': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export function CitizenShell({
  children,
  title,
  subtitle,
  loading = false,
  loadingVariant = 'list'
}: CitizenShellProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    if (menuKeys == null) return [];
    return resolveCitizenNavItems(menuKeys);
  }, [menuKeys]);

  function confirmLogout() {
    clearSession();
    setLogoutOpen(false);
    router.push(PWA_LOGIN);
  }

  if (menuKeys == null) {
    return (
      <div className="citizen-app citizen-app--native">
        <header className="citizen-app__header">
          <div className="citizen-app__header-left">
            <BrandMark size="sm" className="citizen-app__mark" />
          </div>
          <h2 className="citizen-app__header-title">Prefeitura na Mão</h2>
          <span className="citizen-app__logout" aria-hidden />
        </header>
        <main className="citizen-app__content">
          <CitizenPageSkeleton variant={loadingVariant} />
        </main>
      </div>
    );
  }

  return (
    <div className="citizen-app citizen-app--native">
      <header className="citizen-app__header">
        <div className="citizen-app__header-left">
          <BrandMark size="sm" className="citizen-app__mark" />
        </div>
        <h2 className="citizen-app__header-title">{title || 'Prefeitura na Mão'}</h2>
        <button type="button" className="citizen-app__logout" onClick={() => setLogoutOpen(true)} aria-label="Sair">
          Sair
        </button>
      </header>

      <main className="citizen-app__content">
        {subtitle && (
          <section className="citizen-app__intro">
            <p>{subtitle}</p>
          </section>
        )}
        {navItems.length === 0 ? (
          <section className="panel scheduling-panel">
            <h3>Nenhum serviço disponível</h3>
            <p className="scheduling-copy">
              Os módulos do aplicativo estão temporariamente indisponíveis. Tente novamente mais tarde.
            </p>
          </section>
        ) : loading ? (
          <CitizenPageSkeleton variant={loadingVariant} />
        ) : (
          children
        )}
      </main>

      {navItems.length > 0 ? (
        <nav
          className="citizen-app__nav"
          aria-label="Navegação do cidadão"
          data-nav-count={navItems.length}
          style={{ '--citizen-nav-count': navItems.length } as React.CSSProperties}
        >
          {navItems.map((item) => {
            const isActive = item.matchPaths.some(
              (path) => pathname === path || pathname.startsWith(`${path}/`)
            );
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`citizen-app__nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="citizen-app__nav-icon-wrapper">
                  <span className="citizen-app__nav-pill" />
                  <span className="citizen-app__nav-icon">{NAV_ICONS[item.iconKey]}</span>
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
