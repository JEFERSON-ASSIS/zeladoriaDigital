'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession } from '../lib/auth';
import { BrandMark } from './brand-logo';

type CitizenShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

const NAV_ITEMS = [
  {
    href: '/nova-ocorrencia',
    label: 'Solicitar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    )
  },
  {
    href: '/minhas-solicitacoes',
    label: 'Chamados',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    href: '/agendamento',
    label: 'Agendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="3" />
      </svg>
    )
  },
  {
    href: '/meus-agendamentos',
    label: 'Consultas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
] as const;

export function CitizenShell({ children, title, subtitle }: CitizenShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    clearSession();
    router.push('/login');
  }

  return (
    <div className="citizen-app">
      <header className="citizen-app__header">
        <div className="citizen-app__brand">
          <BrandMark size="sm" className="citizen-app__mark" />
          <div>
            <strong>Prefeitura na Mão</strong>
            <span>App do cidadão</span>
          </div>
        </div>
        <button type="button" className="citizen-app__logout" onClick={logout}>
          Sair
        </button>
      </header>

      <main className="citizen-app__content">
        {(title || subtitle) && (
          <section className="citizen-app__intro">
            {title ? <h1>{title}</h1> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </section>
        )}
        {children}
      </main>

      <nav className="citizen-app__nav" aria-label="Navegação do cidadão">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`citizen-app__nav-link${isActive ? ' is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="citizen-app__nav-icon">{item.icon}</span>
              <span className="citizen-app__nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
