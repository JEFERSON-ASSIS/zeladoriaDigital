'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWhatsAppHistory, getStoredAccessToken } from '../../../lib/api';

type WhatsAppHistoryItem = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
};

function parseBody(body: string) {
  try {
    return JSON.parse(body) as {
      event?: string;
      protocol?: string;
      phone?: string | null;
      message?: string;
      provider?: string;
      delivered?: boolean;
    };
  } catch {
    return null;
  }
}

export default function WhatsAppPage() {
  const history = useQuery({
    queryKey: ['whatsapp-history'],
    queryFn: () => fetchWhatsAppHistory(getStoredAccessToken(), 25),
    staleTime: 30_000
  });

  const messages = (history.data ?? []) as WhatsAppHistoryItem[];
  const parsedMessages = messages.map((item) => ({ ...item, parsed: parseBody(item.body) }));

  return (
    <section className="admin-shell">
      <header className="hero">
        <p className="eyebrow">WhatsApp</p>
        <h2>Histórico de mensagens</h2>
        <p>Registro das mensagens preparadas ou enviadas pelo sistema.</p>
      </header>

      {history.isLoading ? <p>Carregando histórico...</p> : null}

      <div className="cards">
        <article className="card">
          <span>Total registrado</span>
          <strong>{messages.length}</strong>
        </article>
        <article className="card">
          <span>Últimos eventos</span>
          <strong>{Math.min(messages.length, 25)}</strong>
        </article>
        <article className="card">
          <span>Status</span>
          <strong>Operacional</strong>
        </article>
      </div>

      <div className="report-list">
        {parsedMessages.length === 0 ? <article className="list-item">Nenhuma mensagem registrada ainda.</article> : null}
        {parsedMessages.map((item) => (
          <article key={item.id} className="list-item">
            <p className="eyebrow">{item.parsed?.event ?? item.subject}</p>
            <h3>{item.parsed?.protocol ?? item.subject}</h3>
            <p>{item.parsed?.message ?? item.body}</p>
            <p className="muted-copy">
              {item.parsed?.provider ?? 'local-queue'} · {item.parsed?.delivered ? 'enviada' : 'registrada'} ·{' '}
              {new Date(item.createdAt).toLocaleString('pt-BR')}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
