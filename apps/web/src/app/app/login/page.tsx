'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenProductLogo } from '../../../components/brand-logo';
import { login, fetchCurrentUser } from '../../../lib/auth-api';
import { getSession } from '../../../lib/auth';
import { refreshCitizenSession, resolveCitizenPwaHome } from '../../../lib/citizen-pwa-access';
import { PWA_LOGIN } from '../../../lib/pwa';
import { showDemoHints } from '../../../lib/demo-hints';

export default function PwaLoginPage() {
  const router = useRouter();
  const demoHints = showDemoHints();
  const [email, setEmail] = useState(demoHints ? 'cidadao@zeladoria.local' : '');
  const [password, setPassword] = useState(demoHints ? 'secret123' : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    if (session.user.role === 'CIDADAO') {
      router.replace(resolveCitizenPwaHome(session.user.menuKeys));
      return;
    }
    router.replace('/');
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      let user;
      try {
        user = await fetchCurrentUser(result.access_token);
      } catch {
        user = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role
        };
      }

      if (user.role !== 'CIDADAO') {
        setError('Este aplicativo é exclusivo para cidadãos. Gestores devem acessar o sistema web.');
        setLoading(false);
        return;
      }

      const session = await refreshCitizenSession(result.access_token, user);
      const home = resolveCitizenPwaHome(session.user.menuKeys);
      router.push(home !== PWA_LOGIN ? home : '/app');
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell login-shell--pwa">
      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-mobile-brand">
            <CitizenProductLogo size="md" />
          </div>
          <h1>Entrar</h1>
          <p className="login-copy">Use sua conta de cidadão para acessar solicitações e agendamentos.</p>
          <form onSubmit={onSubmit} className="login-form">
            <label>
              E-mail
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
            </label>
            <label>
              Senha
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required autoComplete="current-password" />
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar no app'}
            </button>
          </form>
          {/* <p className="login-copy login-copy--hint">
            É gestor ou servidor? <Link href="/login">Acessar sistema web</Link>
          </p> */}
          <p className="login-credit">
            Desenvolvido por <strong>i7AI Sistemas inteligentes</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
