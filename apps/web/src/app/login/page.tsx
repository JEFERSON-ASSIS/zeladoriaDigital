'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/brand-logo';
import { login, fetchCurrentUser } from '../../lib/auth-api';
import { getSession, setSession } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@zeladoria.local');
  const [password, setPassword] = useState('secret123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) {
      router.replace('/');
    }
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      const user = await fetchCurrentUser(result.access_token);
      setSession({
        accessToken: result.access_token,
        user
      });
      router.push('/');
      router.refresh();
    } catch {
      setError('Não foi possível entrar. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <aside className="login-brand-panel">
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
          <span className="login-product-label">Zeladoria Digital</span>
          <p className="eyebrow">Acesso à plataforma</p>
          <h1>Entrar no sistema</h1>
          <p className="login-copy">Use um usuário cadastrado para acessar o painel operacional.</p>
          <p className="login-copy">No celular, o app pode ser instalado na tela inicial.</p>
          <p className="login-copy login-copy--hint">
            Cidadão: <strong>cidadao@zeladoria.local</strong> · Admin secretaria: <strong>secretaria@zeladoria.local</strong> · Usuário secretaria: <strong>equipe@zeladoria.local</strong> · Admin: <strong>admin@zeladoria.local</strong> · Senha: <strong>secret123</strong>
          </p>
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
        </div>
      </section>
    </main>
  );
}
