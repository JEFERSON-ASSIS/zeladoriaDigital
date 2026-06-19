'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getSession, type AuthSession } from '../../lib/auth';
import { fetchCurrentUser } from '../../lib/auth-api';
import { fetchMyOccurrences, fetchOccurrenceByProtocol } from '../../lib/api';
import { formatOccurrenceStatus, formatPriority } from '../../lib/occurrence-map';
import { CitizenShell } from '../../components/citizen-shell';
import { PWA_LOGIN, pwaPath } from '../../lib/pwa';
import { OccurrenceAttachments } from '../../components/occurrence-attachments';

type Movement = {
  id: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  createdAt: string;
};

type CitizenOccurrence = {
  id: string;
  protocol: string;
  title?: string | null;
  description: string;
  status: string;
  priority: string;
  address: string;
  category?: { name?: string | null } | null;
  neighborhood?: { name?: string | null } | null;
  suggestedDepartment?: { name?: string | null } | null;
  serviceOrders?: { department?: { name?: string | null } | null }[];
  movements?: Movement[];
  attachments?: { id: string; fileUrl: string; fileType: string }[];
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [items, setItems] = useState<CitizenOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [protocolQuery, setProtocolQuery] = useState('');
  const [foundProtocol, setFoundProtocol] = useState<CitizenOccurrence | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace(PWA_LOGIN);
      return;
    }

    fetchCurrentUser(currentSession.accessToken)
      .then((user) => setSession({ ...currentSession, user }))
      .catch(() => {
        clearSession();
        router.replace(PWA_LOGIN);
      })
      .finally(() => {
        fetchMyOccurrences(currentSession.accessToken)
          .then((occurrences) => {
            setItems(occurrences);
            setListError(null);
          })
          .catch((loadError) => {
            setItems([]);
            setListError(
              loadError instanceof Error ? loadError.message : 'Não foi possível carregar suas solicitações.'
            );
          })
          .finally(() => setLoading(false));
      });
  }, [router]);

  async function handleProtocolSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = getSession();
    const query = protocolQuery.trim();
    if (!currentSession || !query) {
      setSearchError('Informe o número do protocolo.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setFoundProtocol(null);

    try {
      const result = (await fetchOccurrenceByProtocol(query, currentSession.accessToken)) as CitizenOccurrence;
      setFoundProtocol(result);
    } catch (searchError) {
      setSearchError(
        searchError instanceof Error ? searchError.message : 'Não foi possível buscar o protocolo.'
      );
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">Carregando</p>
          <h1>Minhas solicitações...</h1>
          <p className="login-copy">Consultando o histórico do cidadão.</p>
        </section>
      </main>
    );
  }

  return (
    <CitizenShell title="Minhas solicitações" subtitle="Acompanhe protocolos, secretaria responsável e histórico.">
      <h3 className="form-section-title">Consultar por protocolo</h3>
      <form className="protocol-search" onSubmit={handleProtocolSearch}>
        <input
          value={protocolQuery}
          onChange={(event) => {
            setProtocolQuery(event.target.value);
            if (searchError) setSearchError(null);
          }}
          placeholder="Ex.: OC-0001"
          autoComplete="off"
        />
        <button type="submit" disabled={searching}>
          {searching ? 'Buscando...' : 'Buscar'}
        </button>
      </form>
      {searchError ? <p className="login-error">{searchError}</p> : null}
      {listError ? <p className="login-error">{listError}</p> : null}
      {foundProtocol ? (
        <article className="order-card" style={{ marginTop: 12 }}>
          <p className="eyebrow">{foundProtocol.protocol}</p>
          <h3>{foundProtocol.title ?? foundProtocol.description}</h3>
          <div className="occurrence-status-row">
            <span className={`pill pill-status pill-status--${foundProtocol.status.toLowerCase()}`}>
              {formatOccurrenceStatus(foundProtocol.status)}
            </span>
            <span className="pill">{formatPriority(foundProtocol.priority)}</span>
          </div>
          <p>{foundProtocol.address}</p>
        </article>
      ) : null}

      <h3 className="form-section-title">Resumo</h3>
      <div className="cards">
          <article className="card">
            <span>Total</span>
            <strong>{items.length}</strong>
          </article>
          <article className="card">
            <span>Em andamento</span>
            <strong>{items.filter((item) => !['CONCLUIDO', 'CANCELADO'].includes(item.status)).length}</strong>
          </article>
          <article className="card">
            <span>Concluídas</span>
            <strong>{items.filter((item) => item.status === 'CONCLUIDO').length}</strong>
          </article>
        </div>

      <h3 className="form-section-title">Chamados</h3>
      <div className="orders-grid">
          {items.length === 0 ? (
            <article className="panel">
              <h3>Nenhuma solicitação encontrada</h3>
              <p>Abra uma nova ocorrência para começar a acompanhar seu protocolo.</p>
            </article>
          ) : (
            items.map((item) => (
              <article key={item.id} className="order-card">
                <p className="eyebrow">{item.protocol}</p>
                <h3>{item.title ?? item.description}</h3>
                <div className="occurrence-status-row">
                  <span className={`pill pill-status pill-status--${item.status.toLowerCase()}`}>
                    {formatOccurrenceStatus(item.status)}
                  </span>
                  <span className="pill">{formatPriority(item.priority)}</span>
                </div>
                <p>Secretaria: {item.suggestedDepartment?.name ?? item.serviceOrders?.[0]?.department?.name ?? 'Em análise'}</p>
                <p>Bairro: {item.neighborhood?.name ?? 'Sem bairro'}</p>
                <p>Endereço: {item.address}</p>
                <OccurrenceAttachments attachments={item.attachments} />
                <div className="timeline">
                  {(item.movements ?? []).map((movement) => (
                    <article key={movement.id}>
                      <strong>{formatOccurrenceStatus(movement.toStatus)}</strong>
                      <p>{movement.note ?? 'Movimentação registrada.'}</p>
                    </article>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
    </CitizenShell>
  );
}
