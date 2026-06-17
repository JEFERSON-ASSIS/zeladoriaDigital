'use client';

import { useState } from 'react';
import {
  canUseSchedulingPush,
  requestSchedulingNotificationPermission,
  subscribeSchedulingPush
} from '../lib/scheduling/push-subscription';
import { getNotificationPermission } from '../lib/scheduling/scheduling-reminders';

type SchedulingReminderPromptProps = {
  compact?: boolean;
};

export function SchedulingReminderPrompt({ compact }: SchedulingReminderPromptProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'error'>('idle');
  const permission = getNotificationPermission();

  if (permission === 'granted') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Lembretes ativos: você será avisado 1 dia antes de consultas pendentes.
      </p>
    );
  }

  if (permission === 'denied') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Notificações bloqueadas no navegador. Libere nas configurações do celular para receber lembretes.
      </p>
    );
  }

  if (permission === 'unsupported') {
    return null;
  }

  async function enableReminders() {
    setStatus('loading');

    const localPermission = await requestSchedulingNotificationPermission();
    if (localPermission !== 'granted') {
      setStatus('denied');
      return;
    }

    if (canUseSchedulingPush()) {
      const push = await subscribeSchedulingPush();
      if (!push.ok && push.reason !== 'missing-vapid') {
        setStatus('error');
        return;
      }
    }

    setStatus('enabled');
  }

  if (status === 'enabled') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Lembretes ativados. Avisaremos 1 dia antes da consulta.
      </p>
    );
  }

  return (
    <div className={`scheduling-reminder-prompt${compact ? ' scheduling-reminder-prompt--compact' : ''}`}>
      <p className="scheduling-copy">
        Ative os lembretes para receber um aviso <strong>1 dia antes</strong> da consulta (status pendente).
      </p>
      <button
        type="button"
        className="scheduling-reminder-btn"
        disabled={status === 'loading'}
        onClick={() => void enableReminders()}
      >
        {status === 'loading' ? 'Ativando...' : 'Ativar lembretes'}
      </button>
      {status === 'error' ? (
        <p className="login-error">Não foi possível registrar os lembretes no servidor.</p>
      ) : null}
    </div>
  );
}
