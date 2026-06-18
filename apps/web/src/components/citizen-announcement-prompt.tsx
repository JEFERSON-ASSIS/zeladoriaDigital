'use client';

import { useState } from 'react';
import {
  canUseCitizenPush,
  requestCitizenNotificationPermission,
  subscribeCitizenAppPush
} from '../lib/citizen-push-subscription';
import { getSession } from '../lib/auth';

export function CitizenAnnouncementPrompt() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'error'>('idle');

  if (!canUseCitizenPush()) return null;

  if (typeof window !== 'undefined' && Notification.permission === 'granted') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Notificações ativas: você receberá avisos importantes da prefeitura.
      </p>
    );
  }

  if (typeof window !== 'undefined' && Notification.permission === 'denied') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Notificações bloqueadas. Libere nas configurações do celular para receber avisos.
      </p>
    );
  }

  async function enablePush() {
    const session = getSession();
    if (!session) return;

    setStatus('loading');
    const permission = await requestCitizenNotificationPermission();
    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }

    const result = await subscribeCitizenAppPush(session.accessToken);
    if (!result.ok) {
      setStatus('error');
      return;
    }

    setStatus('enabled');
  }

  if (status === 'enabled') {
    return (
      <p className="scheduling-copy scheduling-reminder-note">
        Notificações ativadas. Avisaremos quando houver novidades.
      </p>
    );
  }

  return (
    <div className="scheduling-reminder-prompt scheduling-reminder-prompt--compact">
      <p className="scheduling-copy">
        Ative as notificações para receber <strong>avisos e comunicados</strong> da prefeitura no celular.
      </p>
      <button
        type="button"
        className="scheduling-reminder-btn"
        disabled={status === 'loading'}
        onClick={() => void enablePush()}
      >
        {status === 'loading' ? 'Ativando...' : 'Ativar avisos push'}
      </button>
      {status === 'error' ? (
        <p className="login-error">Não foi possível registrar as notificações.</p>
      ) : null}
    </div>
  );
}
