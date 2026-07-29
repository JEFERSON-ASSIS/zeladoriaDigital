'use client';

import { useEffect, useState } from 'react';
import { CitizenAppShell } from '../../components/citizen-app-shell';
import { SupportChatThread } from '../../components/support-chat-thread';
import { getSession } from '../../lib/auth';
import { getCitizenSupportConversation, type SupportConversation } from '../../lib/support-chat-api';

export default function CitizenConversationsPage() {
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [error, setError] = useState('');
  const session = getSession();

  useEffect(() => {
    if (!session?.accessToken) return;
    getCitizenSupportConversation(session.accessToken).then(setConversation).catch((err) => setError(err.message));
  }, [session?.accessToken]);

  return (
    <CitizenAppShell title="Conversas" subtitle="Fale diretamente com a equipe de atendimento.">
      {error ? <p className="login-error">{error}</p> : null}
      {!conversation ? <p className="scheduling-copy">Carregando conversa...</p> : null}
      {conversation && session ? <SupportChatThread conversation={conversation} token={session.accessToken} ownType="CIDADAO" /> : null}
    </CitizenAppShell>
  );
}
