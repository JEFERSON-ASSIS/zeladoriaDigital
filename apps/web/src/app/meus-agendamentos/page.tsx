'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { CitizenShell } from '../../components/citizen-shell';
import { CitizenConfirmDialog } from '../../components/citizen-confirm-dialog';
import { PsfSelectionFlow } from '../../components/psf-selection-flow';
import {
  getSavedPsfConfig,
  getSavedPsfId,
  formatCpf,
  getPatientProfile,
  savePsfChoice,
  onlyDigits
} from '../../lib/scheduling/psf-storage';
import {
  cancelAppointment,
  listAllAppointmentsForPwa,
  SchedulingApiError,
  type SchedulingAppointment
} from '../../lib/scheduling/scheduling-api';
import {
  formatHistoryTimestamp,
  formatRemoteStatus,
  getHistoryDisplayStatus,
  getSchedulingHistory,
  isCancellableRemoteStatus,
  recordCancellationHistory,
  syncHistoryWithRemote,
  type SchedulingHistoryEntry
} from '../../lib/scheduling/scheduling-history';
import { processAppointmentReminders } from '../../lib/scheduling/scheduling-reminders';
import { SchedulingReminderPrompt } from '../../components/scheduling-reminder-prompt';
import type { PsfId } from '../../lib/scheduling/psf-config';

const AUTO_REFRESH_MS = 60_000;

export default function MyAppointmentsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [needsPsf, setNeedsPsf] = useState(false);
  const [cpf, setCpf] = useState('');
  const [searching, setSearching] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<SchedulingAppointment[]>([]);
  const [history, setHistory] = useState<SchedulingHistoryEntry[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [partialSync, setPartialSync] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SchedulingAppointment | null>(null);
  const cpfRef = useRef('');

  const loadHistory = useCallback((document: string) => {
    setHistory(getSchedulingHistory(document));
  }, []);

  const search = useCallback(async (value?: string, options?: { silent?: boolean }) => {
    const psf = getSavedPsfConfig();
    const document = onlyDigits(value ?? cpfRef.current);

    if (!psf) {
      setNeedsPsf(true);
      return;
    }

    if (document.length !== 11) {
      if (!options?.silent) {
        setError('Informe um CPF válido com 11 dígitos.');
      }
      return;
    }

    if (!options?.silent) {
      setSearching(true);
      setError(null);
      setSuccess(null);
    }

    try {
      const result = await listAllAppointmentsForPwa(psf, document);
      const synced = syncHistoryWithRemote(document, result.agendamentos, psf.id, psf.label);
      setItems(result.agendamentos);
      setHistory(synced);
      setPartialSync(result.partialSync ?? false);
      setLastSyncedAt(new Date().toISOString());
      void processAppointmentReminders(result.agendamentos, psf.label);
    } catch (searchError) {
      if (!options?.silent) {
        setItems([]);
        loadHistory(document);
        setError(searchError instanceof SchedulingApiError ? searchError.message : 'Não foi possível consultar.');
      }
    } finally {
      if (!options?.silent) {
        setSearching(false);
      }
    }
  }, [loadHistory]);

  useEffect(() => {
    cpfRef.current = cpf;
  }, [cpf]);

  useEffect(() => {
    if (!getSession()) {
      router.replace('/login');
      return;
    }

    if (!getSavedPsfId()) {
      setNeedsPsf(true);
      setReady(true);
      return;
    }

    const profile = getPatientProfile();
    if (profile?.cpf) {
      setCpf(profile.cpf);
      loadHistory(onlyDigits(profile.cpf));
      void search(profile.cpf);
    }

    setReady(true);
  }, [router, loadHistory, search]);

  useEffect(() => {
    if (!ready) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && cpfRef.current.replace(/\D/g, '').length === 11) {
        void search(undefined, { silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(() => {
      if (cpfRef.current.replace(/\D/g, '').length === 11) {
        void search(undefined, { silent: true });
      }
    }, AUTO_REFRESH_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [ready, search]);

  function handlePsfConfirmed(psfId: PsfId) {
    savePsfChoice(psfId);
    setNeedsPsf(false);
    const profile = getPatientProfile();
    if (profile?.cpf) {
      setCpf(profile.cpf);
      loadHistory(onlyDigits(profile.cpf));
      void search(profile.cpf);
    }
  }

  async function handleCancel(item: SchedulingAppointment) {
    const psf = getSavedPsfConfig();
    if (!psf) return;

    setCancellingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await cancelAppointment(psf, item.id);

      recordCancellationHistory(item.id, {
        psfId: psf.id,
        psfLabel: psf.label,
        nome: item.nome,
        cpf: onlyDigits(cpf),
        servico: item.servico ?? 'Consulta',
        data: item.data,
        hora: item.hora
      });

      await search(undefined, { silent: true });
      setCancelTarget(null);
      setSuccess(result.message ?? 'Agendamento cancelado com sucesso. O registro foi removido na unidade de saúde.');
    } catch (cancelError) {
      setError(cancelError instanceof SchedulingApiError ? cancelError.message : 'Não foi possível cancelar.');
    } finally {
      setCancellingId(null);
    }
  }

  if (!ready) {
    return (
      <CitizenShell title="Meus agendamentos" subtitle="Carregando...">
        <section className="panel scheduling-panel">
          <p className="scheduling-copy">Carregando...</p>
        </section>
      </CitizenShell>
    );
  }

  if (needsPsf) {
    return (
      <CitizenShell title="Meus agendamentos" subtitle="Primeiro, informe em qual PSF você se consulta.">
        <PsfSelectionFlow onConfirmed={handlePsfConfirmed} />
      </CitizenShell>
    );
  }

  const psf = getSavedPsfConfig();

  return (
    <CitizenShell
      title="Meus agendamentos"
      subtitle={psf ? `Consultas em ${psf.label}` : 'Consulte seus agendamentos pelo CPF.'}
    >
      <section className="panel scheduling-panel">
        <form
          className="protocol-search"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <input
            value={cpf}
            onChange={(event) => setCpf(formatCpf(event.target.value))}
            placeholder="CPF do paciente"
            inputMode="numeric"
          />
          <button type="submit" disabled={searching}>
            {searching ? 'Buscando...' : 'Consultar'}
          </button>
          <button
            type="button"
            className="scheduling-refresh-btn"
            disabled={searching}
            onClick={() => void search()}
          >
            Atualizar
          </button>
        </form>

        <SchedulingReminderPrompt compact />

        {lastSyncedAt ? (
          <p className="scheduling-copy scheduling-sync-meta">
            Status sincronizado com a unidade em {formatHistoryTimestamp(lastSyncedAt)}.
            {partialSync
              ? ' Sincronização parcial: aguardando atualização do servidor (listar_pwa).'
              : null}
          </p>
        ) : null}

        {error ? <p className="login-error">{error}</p> : null}
        {success ? <p className="success-message">{success}</p> : null}

        {searching ? <p className="scheduling-copy">Consultando agendamentos...</p> : null}

        {!searching && items.length === 0 && !error ? (
          <p className="scheduling-copy">Nenhum agendamento encontrado para este CPF.</p>
        ) : null}

        {items.length > 0 ? (
          <div className="orders-grid" style={{ marginTop: 16 }}>
            {items.map((item) => {
              const cancellable = isCancellableRemoteStatus(item.status);
              return (
                <article key={item.id} className="panel order-card">
                  <p className="eyebrow">#{item.id}</p>
                  <h3>{item.servico ?? 'Consulta'}</h3>
                  <p>Paciente: {item.nome ?? '—'}</p>
                  <p>
                    Data: {item.data ?? '—'}
                    {item.hora ? ` · ${item.hora}` : ''}
                  </p>
                  <p>
                    Status:{' '}
                    <span className={`scheduling-status scheduling-status--${cancellable ? 'active' : 'other'}`}>
                      {formatRemoteStatus(item.status)}
                    </span>
                  </p>
                  {cancellable ? (
                    <button
                      type="button"
                      className="scheduling-cancel-btn"
                      disabled={cancellingId === item.id}
                      onClick={() => setCancelTarget(item)}
                    >
                      Cancelar agendamento
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={() => router.push('/agendamento')}>
            Novo agendamento
          </button>
        </div>
      </section>

      <section className="panel scheduling-panel scheduling-history">
        <p className="eyebrow">Histórico neste aparelho</p>
        <h3>Agendamentos e cancelamentos</h3>
        <p className="scheduling-copy">
          Registro local sincronizado com o sistema da unidade. Quando o status mudar na recepção, ele atualiza aqui
          automaticamente.
        </p>

        {history.length === 0 ? (
          <p className="scheduling-copy">Nenhum registro local ainda.</p>
        ) : (
          <ul className="scheduling-history__list">
            {history.map((entry) => (
              <li key={entry.localId} className={`scheduling-history__item scheduling-history__item--${entry.status}`}>
                <div className="scheduling-history__top">
                  <strong>{entry.servico}</strong>
                  <span className={`scheduling-history__badge scheduling-history__badge--${entry.status}`}>
                    {getHistoryDisplayStatus(entry)}
                  </span>
                </div>
                <p>
                  #{entry.appointmentId} · {entry.psfLabel} · {entry.data}
                  {entry.hora ? ` às ${entry.hora}` : ''}
                </p>
                <p>{entry.nome}</p>
                <p className="scheduling-history__meta">
                  Agendado em: {formatHistoryTimestamp(entry.bookedAt)}
                </p>
                {entry.syncedAt ? (
                  <p className="scheduling-history__meta">
                    Sincronizado em: {formatHistoryTimestamp(entry.syncedAt)}
                  </p>
                ) : null}
                {entry.cancelledAt ? (
                  <p className="scheduling-history__meta">
                    Cancelado em: {formatHistoryTimestamp(entry.cancelledAt)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <CitizenConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancelar agendamento"
        description="Esta ação remove a consulta no sistema da unidade de saúde. Deseja continuar?"
        details={
          cancelTarget
            ? [
                { label: 'Protocolo', value: `#${cancelTarget.id}` },
                { label: 'Serviço', value: cancelTarget.servico ?? 'Consulta' },
                {
                  label: 'Data e hora',
                  value: `${cancelTarget.data ?? '—'}${cancelTarget.hora ? ` · ${cancelTarget.hora}` : ''}`
                },
                { label: 'Paciente', value: cancelTarget.nome ?? '—' }
              ]
            : []
        }
        warning="O cancelamento ficará registrado neste aparelho para consulta futura."
        confirmLabel="Sim, cancelar consulta"
        cancelLabel="Manter agendamento"
        destructive
        loading={Boolean(cancelTarget && cancellingId === cancelTarget.id)}
        onClose={() => {
          if (!cancellingId) setCancelTarget(null);
        }}
        onConfirm={() => {
          if (cancelTarget) void handleCancel(cancelTarget);
        }}
      />
    </CitizenShell>
  );
}
