'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import { CitizenAppShell } from '../../components/citizen-app-shell';
import { useResolvedPsfUnit } from '../../hooks/use-resolved-psf-unit';
import { buildPwaLoginUrl, pwaPath } from '../../lib/pwa';
import { parsePsfIdFromPath, unitPath } from '../../lib/psf-unit';
import { CitizenConfirmDialog } from '../../components/citizen-confirm-dialog';
import { formatCpf, getSavedPsfConfig, getPatientProfile } from '../../lib/scheduling/psf-storage';
import {
  cancelAppointment,
  listAllAppointmentsForPwaAccount,
  SchedulingApiError,
  type SchedulingAppointment
} from '../../lib/scheduling/scheduling-api';
import { formatRemoteStatus, isCancellableRemoteStatus } from '../../lib/scheduling/scheduling-history';
import { processAppointmentReminders } from '../../lib/scheduling/scheduling-reminders';
import { SchedulingReminderPrompt } from '../../components/scheduling-reminder-prompt';

const AUTO_REFRESH_MS = 60_000;

export default function MyAppointmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const unit = useResolvedPsfUnit();
  const [ready, setReady] = useState(false);
  const [needsPsf, setNeedsPsf] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<SchedulingAppointment[]>([]);
  const [cancelTarget, setCancelTarget] = useState<SchedulingAppointment | null>(null);

  const search = useCallback(async (options?: { silent?: boolean }) => {
    const psf = unit?.psf ?? getSavedPsfConfig();

    if (!psf) {
      setNeedsPsf(true);
      return;
    }

    if (!options?.silent) {
      setSearching(true);
      setError(null);
      setSuccess(null);
    }

    try {
      const result = await listAllAppointmentsForPwaAccount(psf);
      setItems(result.agendamentos);
      void processAppointmentReminders(result.agendamentos, psf.label);
    } catch (searchError) {
      if (!options?.silent) {
        setItems([]);
        setError(searchError instanceof SchedulingApiError ? searchError.message : 'Não foi possível consultar.');
      }
    } finally {
      if (!options?.silent) {
        setSearching(false);
      }
    }
  }, [unit]);

  useEffect(() => {
    const unitFromPath = parsePsfIdFromPath(pathname);
    const loginReturnPath = unitFromPath ? unitPath(unitFromPath, '/meus-agendamentos') : pwaPath('/meus-agendamentos');
    const loginUrl = buildPwaLoginUrl(loginReturnPath);
    if (!getSession()) {
      router.replace(loginUrl);
      return;
    }

    if (unit) {
      setNeedsPsf(false);
    } else if (!getSavedPsfConfig()) {
      setNeedsPsf(true);
      setReady(true);
      return;
    }

    const profile = getPatientProfile();
    if (profile?.telefone) {
      void search();
    }

    setReady(true);
  }, [router, search, unit, pathname]);

  useEffect(() => {
    if (!ready) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void search({ silent: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(() => {
      void search({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [ready, search]);

  async function handleCancel(item: SchedulingAppointment) {
    const psf = unit?.psf ?? getSavedPsfConfig();
    if (!psf) return;

    setCancellingId(item.id);
    setError(null);
    setSuccess(null);

    try {
      const result = await cancelAppointment(psf, item.id);

      await search({ silent: true });
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
      <CitizenAppShell title="Meus agendamentos" subtitle="Carregando...">
        <section className="panel scheduling-panel">
          <p className="scheduling-copy">Carregando...</p>
        </section>
      </CitizenAppShell>
    );
  }

  if (needsPsf) {
    return (
      <CitizenAppShell title="Meus agendamentos" subtitle="Use o link da sua unidade de saúde.">
        <section className="panel scheduling-panel">
          <p className="scheduling-copy">
            Seu cadastro ainda não está vinculado a uma unidade. Acesse o link oficial do PSF para consultar
            agendamentos.
          </p>
        </section>
      </CitizenAppShell>
    );
  }

  const psf = unit?.psf ?? getSavedPsfConfig();

  return (
    <CitizenAppShell
      title="Meus agendamentos"
      subtitle={psf ? `Todos os agendamentos feitos pela sua conta em ${psf.label}` : 'Agendamentos da sua conta.'}
    >
      <section className="panel scheduling-panel">
        <div className="protocol-search">
          <p className="scheduling-copy">
            Aqui aparecem todos os pacientes agendados usando o telefone da sua conta.
          </p>
          <button
            type="button"
            className="scheduling-refresh-btn"
            disabled={searching}
            onClick={() => void search()}
          >
            {searching ? 'Atualizando...' : 'Atualizar agendamentos'}
          </button>
        </div>

        <SchedulingReminderPrompt compact />

        {error ? <p className="login-error">{error}</p> : null}
        {success ? <p className="success-message">{success}</p> : null}

        {searching ? <p className="scheduling-copy">Consultando agendamentos...</p> : null}

        {!searching && items.length === 0 && !error ? (
          <p className="scheduling-copy">Nenhum agendamento encontrado para esta conta.</p>
        ) : null}

        {items.length > 0 ? (
          <div className="orders-grid" style={{ marginTop: 16 }}>
            {items.map((item) => {
              const cancellable = isCancellableRemoteStatus(item.status);
              return (
                <article key={item.id} className="order-card">
                  <p className="eyebrow">#{item.id}</p>
                  <h3>{item.servico ?? 'Consulta'}</h3>
                  <p>Paciente: {item.nome ?? '—'}</p>
                  {item.cpf ? <p>CPF: {formatCpf(item.cpf)}</p> : null}
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
          <button
            type="button"
            onClick={() => router.push(unit ? unit.path('/agendamento') : pwaPath('/agendamento'))}
          >
            Novo agendamento
          </button>
        </div>
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
        warning="O cancelamento ficará registrado no histórico da unidade."
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
    </CitizenAppShell>
  );
}
