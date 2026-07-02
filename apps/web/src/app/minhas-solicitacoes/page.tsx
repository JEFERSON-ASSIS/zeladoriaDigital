'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CitizenEmptyState } from '../../components/citizen-empty-state';
import { CitizenShell } from '../../components/citizen-shell';
import { OccurrenceAttachments } from '../../components/occurrence-attachments';
import { clearSession, getSession } from '../../lib/auth';
import { fetchCurrentUser } from '../../lib/auth-api';
import { fetchMyOccurrences, fetchOccurrenceByProtocol } from '../../lib/api';
import { formatOccurrenceStatus, formatPriority } from '../../lib/occurrence-map';
import { PWA_LOGIN, pwaPath } from '../../lib/pwa';

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
  const [items, setItems] = useState<CitizenOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [protocolQuery, setProtocolQuery] = useState('');
  const [foundProtocol, setFoundProtocol] = useState<CitizenOccurrence | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      router.replace(PWA_LOGIN);
      return;
    }

    fetchCurrentUser(currentSession.accessToken)
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

  return (
    <CitizenShell
      title="Minhas solicitações"
      subtitle="Acompanhe protocolos, secretaria responsável e histórico."
      loading={loading}
      loadingVariant="list"
    >
      {!loading ? (
        <>
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
          {searchError ? (
            <p className="login-error" role="alert">
              {searchError}
            </p>
          ) : null}
          {listError ? (
            <p className="login-error" role="alert">
              {listError}
            </p>
          ) : null}
          {foundProtocol ? (
            <article className="order-card" style={{ marginTop: 12 }}>
              <p className="eyebrow citizen-copyable">{foundProtocol.protocol}</p>
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
              <CitizenEmptyState
                title="Nenhuma solicitação ainda"
                description="Registre um problema urbano e acompanhe o andamento pelo protocolo."
                actionLabel="Nova solicitação"
                actionHref={pwaPath('/nova-ocorrencia')}
              />
            ) : (
              items.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <article key={item.id} className={`order-card citizen-occurrence-card${expanded ? ' is-expanded' : ''}`}>
                    <button
                      type="button"
                      className="citizen-occurrence-card__toggle"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      aria-expanded={expanded}
                    >
                      <div>
                        <p className="eyebrow citizen-copyable">{item.protocol}</p>
                        <h3>{item.title ?? item.description}</h3>
                        <div className="occurrence-status-row">
                          <span className={`pill pill-status pill-status--${item.status.toLowerCase()}`}>
                            {formatOccurrenceStatus(item.status)}
                          </span>
                          <span className="pill">{formatPriority(item.priority)}</span>
                        </div>
                      </div>
                      <span className="citizen-occurrence-card__chevron" aria-hidden>
                        {expanded ? '▲' : '▼'}
                      </span>
                    </button>
                    {expanded ? (
                      <div className="citizen-occurrence-card__details">
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
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </CitizenShell>
  );
}
