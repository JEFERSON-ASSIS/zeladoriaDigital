'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/brand-logo';
import { login, fetchCurrentUser } from '../../lib/auth-api';
import { getSession, setSession } from '../../lib/auth';
import { PWA_HOME } from '../../lib/pwa';
import { showDemoHints } from '../../lib/demo-hints';

export default function LoginPage() {
  const router = useRouter();
  const demoHints = showDemoHints();
  const [email, setEmail] = useState(demoHints ? 'admin@zeladoria.local' : '');
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
      setSession({
        accessToken: result.access_token,
        user
      });
      router.push(user.role === 'CIDADAO' ? PWA_HOME : '/');
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <aside className="login-brand-panel" aria-hidden="true">
        <div className="login-brand-content">
          <BrandLogo variant="light" size="lg" showTagline />
          <h2>Tecnologia, IA e gestão pública em uma única plataforma.</h2>
          <p>
            A i7AI Sistemas desenvolve soluções digitais de alto padrão para prefeituras,
            consórcios e instituições que exigem confiança, eficiência e inovação.
          </p>
          <div className="login-brand-features">
            <div className="login-brand-feature">Inteligência artificial aplicada à operação</div>
            <div className="login-brand-feature">Segurança e rastreabilidade institucional</div>
            <div className="login-brand-feature">Interface moderna, clara e responsiva</div>
          </div>
        </div>
      </aside>
      <section className="login-form-panel">
        <div className="login-card">
          <span className="login-product-label">Prefeitura na Mão</span>
          <p className="eyebrow">Sistema web — gestão municipal</p>
          <h1>Entrar no sistema</h1>
          <p className="login-copy">Acesso para administradores, secretarias e equipes de campo.</p>
          {demoHints ? (
            <details className="login-demo-details">
              <summary>Usuários de teste</summary>
              <p className="login-copy login-copy--hint">
                Admin: <strong>admin@zeladoria.local</strong> · Secretaria: <strong>secretaria@zeladoria.local</strong> · Equipe: <strong>equipe@zeladoria.local</strong> · Senha: <strong>secret123</strong>
              </p>
            </details>
          ) : null}
          <form onSubmit={onSubmit} className="login-form">
            <label>
              E-mail
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </label>
            <label>
              Senha
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="login-copy login-copy--hint">
            É cidadão? <Link href="/app">Abrir aplicativo do cidadão (PWA)</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
