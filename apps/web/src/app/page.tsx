'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getNavigationForRole, getNavigationHref, getSession, type AuthSession } from '../lib/auth';
import { fetchDashboardData } from '../lib/api';
import { fetchCurrentUser } from '../lib/auth-api';
import { InstallPWAButton } from '../components/install-pwa-button';

type DashboardData = {
  occurrences: any[];
  citizens: any[];
  users: any[];
  categories: any[];
};

export default function HomePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [data, setData] = useState<DashboardData>({ occurrences: [], citizens: [], users: [], categories: [] });

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      setLoadingSession(false);
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
        fetchDashboardData(currentSession.accessToken)
          .then((value) => setData(value))
          .catch(() => setData({ occurrences: [], citizens: [], users: [], categories: [] }))
          .finally(() => setLoadingSession(false));
      });
  }, [router]);

  const visibleMenus = useMemo(() => getNavigationForRole(session?.user.role), [session]);

  const openOccurrences = data.occurrences.filter((item) => item.status === 'ABERTO').length;
  const inProgressOccurrences = data.occurrences.filter((item) => ['EM_ANALISE', 'ENCAMINHADO', 'EM_EXECUCAO'].includes(item.status)).length;
  const completedOccurrences = data.occurrences.filter((item) => item.status === 'CONCLUIDO').length;
  const canceledOccurrences = data.occurrences.filter((item) => item.status === 'CANCELADO').length;
  const delayedOccurrences = data.occurrences.filter((item) => {
    const createdAt = new Date(item.createdAt ?? Date.now()).getTime();
    return item.status !== 'CONCLUIDO' && Date.now() - createdAt > 1000 * 60 * 60 * 24 * 3;
  }).length;
  const averagePriorityScore = data.occurrences.length
    ? Math.round(data.occurrences.reduce((sum, item) => sum + Number(item.priorityScore ?? 0), 0) / data.occurrences.length)
    : 0;

  const statusSummary = [
    { label: 'Aberto', value: openOccurrences, color: 'var(--primary)' },
    { label: 'Em andamento', value: inProgressOccurrences, color: 'var(--secondary)' },
    { label: 'Concluídas', value: completedOccurrences, color: '#16a34a' },
    { label: 'Canceladas', value: canceledOccurrences, color: '#dc2626' }
  ];

  const topCategories = [...data.occurrences]
    .filter((item) => item.category?.name)
    .reduce<Record<string, number>>((acc, item) => {
      const key = item.category.name;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  function logout() {
    clearSession();
    router.push('/login');
  }

  if (loadingSession) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Carregando</p>
          <h1>Validando sessão...</h1>
          <p className="login-copy">Aguarde um instante enquanto confirmamos seu acesso.</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Sessão</p>
          <h1>Acesso não autenticado</h1>
          <p className="login-copy">Redirecionando para a página de login.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <h1>Zeladoria Digital</h1>
        <p className="sidebar-user">{session?.user.name ?? 'Carregando...'}</p>
        <nav>
          {visibleMenus.map((item) => (
            <button
              key={item}
              type="button"
              className="menu-link"
              onClick={() => router.push(getNavigationHref(item))}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="ghost-button" onClick={logout} type="button">
          Sair
        </button>
      </aside>
      <section className="content">
                <header className="hero">
          <p className="eyebrow">Plataforma municipal</p>
          <h2>Base executiva para operação, triagem e atendimento.</h2>
          <p>Visão executiva com indicadores de operação, mapa e status em tempo real a partir da base atual.</p>
          {session?.user.role === 'CIDADAO' ? <InstallPWAButton /> : null}
        </header>
        <div className="cards">
          {[
            ['Total de ocorrências', data.occurrences.length],
            ['Em andamento', inProgressOccurrences],
            ['Concluídas', completedOccurrences],
            ['Abertas', openOccurrences],
            ['Em atraso', delayedOccurrences],
            ['Score médio', averagePriorityScore]
          ].map(([label, value]) => (
            <article key={label as string} className="card">
              <span>{label}</span>
              <strong>{value as number}</strong>
            </article>
          ))}
        </div>
        <section className="dashboard-grid">
          <article className="panel">
            <div className="panel-heading">
              <h3>Distribuição por status</h3>
              <span>{data.occurrences.length} registros</span>
            </div>
            <div className="status-chart">
              {statusSummary.map((item) => {
                const width = data.occurrences.length ? `${Math.max(8, (item.value / data.occurrences.length) * 100)}%` : '8%';
                return (
                  <div key={item.label} className="status-row">
                    <div className="status-row-label">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="status-bar">
                      <div className="status-bar-fill" style={{ width, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h3>Mapa operacional</h3>
              <span>Camada base</span>
            </div>
            <div className="map-stage">
              <div className="map-glow map-glow-1" />
              <div className="map-glow map-glow-2" />
              <div className="map-glow map-glow-3" />
              <div className="map-grid" />
              <div className="map-pin map-pin-1" />
              <div className="map-pin map-pin-2" />
              <div className="map-pin map-pin-3" />
              <div className="map-pin map-pin-4" />
              <div className="map-card">
                <strong>{data.occurrences.length}</strong>
                <span>ocorrências georreferenciáveis</span>
              </div>
            </div>
          </article>

          <article className="panel panel-span-2">
            <div className="panel-heading">
              <h3>Principais categorias</h3>
              <span>Demanda acumulada</span>
            </div>
            <div className="category-list">
              {Object.entries(topCategories).slice(0, 5).map(([name, value]) => (
                <div key={name} className="category-item">
                  <span>{name}</span>
                  <strong>{value}</strong>
                </div>
              ))}
              {Object.keys(topCategories).length === 0 ? (
                <p className="muted-copy">Sem categorias suficientes para consolidar o gráfico ainda.</p>
              ) : null}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h3>Leitura rápida</h3>
              <span>Operação</span>
            </div>
            <div className="panel-grid">
              <article>
                <span>Usuários ativos</span>
                <strong>{data.users.length}</strong>
              </article>
              <article>
                <span>Status da integração</span>
                <strong>{data.occurrences.length > 0 ? 'Online' : 'Fallback'}</strong>
              </article>
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <h3>Resumo executivo</h3>
              <span>Últimos 3 dias</span>
            </div>
            <p className="summary-copy">
              A operação segue com {openOccurrences} ocorrências abertas, {inProgressOccurrences} em andamento e {completedOccurrences} concluídas.
              Há {delayedOccurrences} itens em atraso monitorado para ação da triagem.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}


