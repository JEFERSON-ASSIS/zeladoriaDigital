'use client';

import { useQuery } from '@tanstack/react-query';
import { formatCpf, formatPhone } from '../lib/scheduling/psf-storage';
import { fetchPushLogs, type PushNotificationLog } from '../lib/push-logs-api';
import { getStoredAccessToken } from '../lib/api';

function formatSentAt(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function sourceLabel(source: PushNotificationLog['source']) {
  if (source === 'ANNOUNCEMENT') return 'Aviso do app';
  if (source === 'SCHEDULING_REMINDER') return 'Lembrete de consulta';
  return source;
}

function formatRecipientLabel(recipient: PushNotificationLog['recipients'][number]) {
  const phone = recipient.phone ? formatPhone(recipient.phone) : null;
  const cpf = recipient.cpf ? formatCpf(recipient.cpf) : null;

  if (phone && cpf) return `${phone} · CPF ${cpf}`;
  if (phone) return phone;
  if (cpf) return `CPF ${cpf}`;
  return 'Destinatário sem identificação';
}

export function PushLogsHistory() {
  const logs = useQuery({
    queryKey: ['push-logs'],
    queryFn: () => fetchPushLogs(getStoredAccessToken()),
    staleTime: 30_000
  });

  return (
    <section className="panel push-logs-panel">
      <div className="panel-heading">
        <div>
          <h3>Histórico de notificações push</h3>
          <p className="muted-copy">
            Registro permanente no banco: data, conteúdo, quantidade enviada e números/CPFs de destino.
          </p>
        </div>
      </div>

      {logs.isLoading ? <p className="muted-copy">Carregando histórico...</p> : null}
      {logs.isError ? <p className="login-error">Não foi possível carregar o histórico de push.</p> : null}

      {!logs.isLoading && !logs.isError && (logs.data?.length ?? 0) === 0 ? (
        <p className="muted-copy">Nenhuma notificação push registrada ainda.</p>
      ) : null}

      <div className="push-logs-list">
        {(logs.data ?? []).map((log) => (
          <article key={log.id} className="push-log-card">
            <header className="push-log-card__header">
              <div>
                <time className="push-log-card__date">{formatSentAt(log.sentAt)}</time>
                <span className="push-log-card__source">{sourceLabel(log.source)}</span>
              </div>
              <div className="push-log-card__stats">
                <strong>{log.successCount}</strong>
                <span>de {log.targetCount} enviados</span>
                {log.failureCount > 0 ? <span className="push-log-card__fail">{log.failureCount} falha(s)</span> : null}
              </div>
            </header>

            <div className="push-log-card__content">
              <p className="push-log-card__title">{log.title}</p>
              <p className="push-log-card__body">{log.body}</p>
            </div>

            <div className="push-log-card__recipients">
              <p className="push-log-card__recipients-title">Destinatários</p>
              <ul>
                {log.recipients.map((recipient) => (
                  <li key={recipient.id} className={recipient.status === 'failed' ? 'is-failed' : undefined}>
                    {formatRecipientLabel(recipient)}
                    {recipient.status === 'failed' ? ` — ${recipient.error ?? 'falhou'}` : null}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
