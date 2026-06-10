'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/auth-api';
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
      setSession({
        accessToken: result.access_token,
        user: result.user
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
      <section className="login-card">
        <p className="eyebrow">Acesso</p>
        <h1>Entrar no Zeladoria Digital</h1>
        <p className="login-copy">Use um usuário cadastrado no banco para acessar o painel.</p>
        <form onSubmit={onSubmit} className="login-form">
          <label>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label>
            Senha
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
