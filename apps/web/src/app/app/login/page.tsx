'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../../components/brand-logo';
import { login, fetchCurrentUser } from '../../../lib/auth-api';
import { getSession, setSession } from '../../../lib/auth';
import { PWA_HOME } from '../../../lib/pwa';
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
      router.replace(PWA_HOME);
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

      setSession({ accessToken: result.access_token, user });
      router.push(PWA_HOME);
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
            <BrandLogo variant="dark" size="md" showTagline={false} />
          </div>
          <span className="login-product-label">Prefeitura na Mão</span>
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
          <p className="login-copy login-copy--hint">
            É gestor ou servidor? <Link href="/login">Acessar sistema web</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
