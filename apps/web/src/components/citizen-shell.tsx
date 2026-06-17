'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '../lib/auth';
import { BrandMark } from './brand-logo';

type CitizenShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function CitizenShell({ children, title, subtitle }: CitizenShellProps) {
  const router = useRouter();

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
            <strong>Zeladoria Digital</strong>
            <span>App do cidadão</span>
          </div>
        </div>
        <button type="button" className="citizen-app__logout" onClick={logout}>
          Sair
        </button>
      </header>

      {(title || subtitle) && (
        <section className="citizen-app__intro">
          {title ? <h1>{title}</h1> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </section>
      )}

      <main className="citizen-app__content">{children}</main>

      <nav className="citizen-app__nav citizen-app__nav--four" aria-label="Navegação do cidadão">
        <a href="/nova-ocorrencia" className="citizen-app__nav-link">
          Nova solicitação
        </a>
        <a href="/minhas-solicitacoes" className="citizen-app__nav-link">
          Minhas solicitações
        </a>
        <a href="/agendamento" className="citizen-app__nav-link">
          Agendar
        </a>
        <a href="/meus-agendamentos" className="citizen-app__nav-link">
          Meus agendamentos
        </a>
      </nav>
    </div>
  );
}
