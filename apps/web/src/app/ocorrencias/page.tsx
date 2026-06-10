'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getNavigationForRole, getSession, type AuthSession } from '../../lib/auth';
import { fetchCurrentUser } from '../../lib/auth-api';
import { fetchOccurrences, updateOccurrenceStatus } from '../../lib/api';

type Occurrence = {
  id: string;
  protocol: string;
  title?: string | null;
  description: string;
  status: string;
  priority: string;
  address: string;
  category?: { name?: string | null } | null;
  neighborhood?: { name?: string | null } | null;
};

const columns = [
  { key: 'ABERTO', label: 'Aberto' },
  { key: 'EM_ANALISE', label: 'Em análise' },
  { key: 'ENCAMINHADO', label: 'Encaminhado' },
  { key: 'EM_EXECUCAO', label: 'Execução' },
  { key: 'CONCLUIDO', label: 'Concluído' }
];

export default function OccurrencesPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [items, setItems] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
        fetchOccurrences(currentSession.accessToken)
          .then(setItems)
          .catch(() => setItems([]))
          .finally(() => setLoading(false));
      });
  }, [router]);

  const menu = useMemo(() => getNavigationForRole(session?.user.role), [session]);

  async function moveOccurrence(id: string, status: string) {
    setBusyId(id);
    try {
      const updated = await updateOccurrenceStatus(id, status, session?.accessToken);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status: updated.status } : item)));
    } finally {
      setBusyId(null);
    }
  }

  function logout() {
    clearSession();
    router.push('/login');
  }

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDrop(status: string) {
    if (!draggingId) return;
    void moveOccurrence(draggingId, status).finally(() => setDraggingId(null));
  }

  if (loading) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Carregando</p>
          <h1>Ocorrências...</h1>
          <p className="login-copy">Preparando o quadro operacional.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <h1>Zeladoria Digital</h1>
        <p className="sidebar-user">{session?.user.name ?? 'Operador'}</p>
        <nav>
          {menu.map((item) => (
            <a key={item} href={item === 'Ordens de serviço' ? '/ordens-servico' : item === 'Ocorrências' ? '/ocorrencias' : '#'}>
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
          <p className="eyebrow">Operação</p>
          <h2>Kanban de ocorrências</h2>
          <p>Arraste mentalmente o fluxo enquanto move os chamados pelos status operacionais.</p>
        </header>

        <div className="kanban">
          {columns.map((column) => (
            <article
              key={column.key}
              className={`kanban-column ${draggingId ? 'kanban-drop-ready' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(column.key)}
            >
              <div className="kanban-column-header">
                <h3>{column.label}</h3>
                <span>{items.filter((item) => item.status === column.key).length}</span>
              </div>
              <div className="kanban-list">
                {items.filter((item) => item.status === column.key).map((item) => {
                  const nextColumn = columns.find((candidate) => columns.indexOf(candidate) === columns.indexOf(column) + 1);
                  return (
                    <article
                      key={item.id}
                      className={`kanban-card ${draggingId === item.id ? 'is-dragging' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(item.id)}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <p className="eyebrow">{item.protocol}</p>
                      <h4>{item.title ?? item.description}</h4>
                      <p>{item.address}</p>
                      <p>{item.category?.name ?? 'Sem categoria'} • {item.neighborhood?.name ?? 'Sem bairro'}</p>
                      <p className="kanban-meta">Prioridade: {item.priority}</p>
                      <div className="kanban-actions">
                        {nextColumn ? (
                          <button disabled={busyId === item.id} onClick={() => moveOccurrence(item.id, nextColumn.key)} type="button">
                            {busyId === item.id ? 'Salvando...' : `Mover para ${nextColumn.label}`}
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
