'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  clearSession,
  getNavigationForRole,
  getNavigationHref,
  getSession,
  type AuthSession
} from '../../lib/auth';
import { createOccurrence, fetchCategories, fetchNeighborhoods } from '../../lib/api';
import { fetchCurrentUser } from '../../lib/auth-api';

export default function NewOccurrencePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude?: number; longitude?: number }>({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    categoryId: '',
    neighborhoodId: ''
  });

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace('/login');
      return;
    }

    fetchCurrentUser(currentSession.accessToken)
      .then((user) => setSession({ ...currentSession, user }))
      .catch(() => {
        clearSession();
        router.replace('/login');
      })
      .finally(() => {
        Promise.all([fetchCategories(currentSession.accessToken), fetchNeighborhoods(currentSession.accessToken)])
          .then(([loadedCategories, loadedNeighborhoods]) => {
            setCategories(loadedCategories);
            setNeighborhoods(loadedNeighborhoods);
          })
          .finally(() => setLoading(false));
      });
  }, [router]);

  const navigation = useMemo(() => getNavigationForRole(session?.user.role), [session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createOccurrence(
        {
          ...form,
          latitude: coords.latitude,
          longitude: coords.longitude,
          citizenId: session?.user.role === 'CIDADAO' ? session.user.id : undefined,
          categoryId: form.categoryId || undefined,
          neighborhoodId: form.neighborhoodId || undefined
        },
        session?.accessToken
      );

      setSuccess(`Ocorrência registrada com protocolo ${result.protocol}.`);
      setForm({
        title: '',
        description: '',
        address: '',
        categoryId: '',
        neighborhoodId: ''
      });
      setCoords({});
    } catch {
      setError('Não foi possível registrar a ocorrência.');
    } finally {
      setSubmitting(false);
    }
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setError('Seu navegador não suporta geolocalização.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => setError('Não foi possível capturar a localização.')
    );
  }

  function logout() {
    clearSession();
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Carregando</p>
          <h1>Nova ocorrência...</h1>
          <p className="login-copy">Preparando o formulário de atendimento.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <h1>Zeladoria Digital</h1>
        <p className="sidebar-user">{session?.user.name ?? 'Cidadão'}</p>
        <nav>
          {navigation.map((item) => (
            <a key={item} href={getNavigationHref(item)}>
              {item}
            </a>
          ))}
        </nav>
        <button className="ghost-button" onClick={logout} type="button">
          Sair
        </button>
      </aside>

      <section className="content">
        <header className="hero">
          <p className="eyebrow">Cidadão</p>
          <h2>Abra sua ocorrência</h2>
          <p>Preencha os dados principais e acompanhe o protocolo gerado automaticamente.</p>
        </header>

        <section className="panel">
          <form className="occurrence-form" onSubmit={handleSubmit}>
            <label>
              Título
              <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
            </label>
            <label>
              Descrição
              <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} rows={5} />
            </label>
            <label>
              Endereço
              <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} />
            </label>
            <div className="panel-grid">
              <label>
                Categoria
                <select value={form.categoryId} onChange={(e) => setForm((current) => ({ ...current, categoryId: e.target.value }))}>
                  <option value="">Selecione</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Bairro
                <select value={form.neighborhoodId} onChange={(e) => setForm((current) => ({ ...current, neighborhoodId: e.target.value }))}>
                  <option value="">Selecione</option>
                  {neighborhoods.map((neighborhood) => (
                    <option key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="panel-grid">
              <article>
                <span>Latitude</span>
                <strong>{coords.latitude ?? '-'}</strong>
              </article>
              <article>
                <span>Longitude</span>
                <strong>{coords.longitude ?? '-'}</strong>
              </article>
            </div>

            {success ? <p className="success-message">{success}</p> : null}
            {error ? <p className="login-error">{error}</p> : null}

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={captureLocation}>
                Capturar localização
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Registrar ocorrência'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
