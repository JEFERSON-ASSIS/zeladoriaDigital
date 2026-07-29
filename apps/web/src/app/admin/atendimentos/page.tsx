'use client';

import { useCallback, useEffect, useState } from 'react';
import { SupportChatThread } from '../../../components/support-chat-thread';
import { getSession } from '../../../lib/auth';
import { fetchCitizens, type AdminCitizenRecord } from '../../../lib/citizens-api';
import {
  connectSupportSocket,
  getSupportConversation,
  listSupportConversations,
  setSupportStatus,
  startSupportConversation,
  type SupportConversation
} from '../../../lib/support-chat-api';

export default function SupportAdminPage() {
  const session = getSession();
  const token = session?.accessToken ?? '';
  const [items, setItems] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [error, setError] = useState('');
  const [citizens, setCitizens] = useState<AdminCitizenRecord[]>([]);
  const [newCitizenId, setNewCitizenId] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try { setItems(await listSupportConversations(token)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível carregar.'); }
  }, [token]);

  useEffect(() => {
    void load();
    if (token) void fetchCitizens(token).then(setCitizens).catch(() => undefined);
  }, [load, token]);
  useEffect(() => {
    if (!token) return;
    const socket = connectSupportSocket(token);
    socket.on('conversation:updated', () => void load());
    return () => { socket.disconnect(); };
  }, [load, token]);

  async function open(item: SupportConversation) {
    const conversation = await getSupportConversation(item.id, token);
    setSelected(conversation);
  }

  async function updateStatus(status: SupportConversation['status']) {
    if (!selected) return;
    await setSupportStatus(selected.id, status, token);
    setSelected(await getSupportConversation(selected.id, token));
    await load();
  }

  async function startConversation() {
    if (!newCitizenId) return;
    const conversation = await startSupportConversation(newCitizenId, token);
    setSelected(conversation);
    setNewCitizenId('');
    await load();
  }

  return (
    <section className="admin-page support-admin">
      <header className="page-header">
        <div><p className="eyebrow">Atendimento</p><h1>Conversas com cidadãos</h1></div>
      </header>
      {error ? <p className="login-error">{error}</p> : null}
      <div className="panel" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={newCitizenId} onChange={(event) => setNewCitizenId(event.target.value)}>
          <option value="">Selecione um cidadão para iniciar a conversa</option>
          {citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.name} · {citizen.phone}</option>)}
        </select>
        <button type="button" disabled={!newCitizenId} onClick={() => void startConversation()}>Nova conversa</button>
      </div>
      <div className="support-admin__layout">
        <aside className="panel support-admin__list">
          {items.length === 0 ? <p>Nenhuma conversa iniciada.</p> : items.map((item) => (
            <button key={item.id} type="button" className={selected?.id === item.id ? 'is-active' : ''} onClick={() => void open(item)}>
              <strong>{item.citizen?.name ?? 'Cidadão'}</strong>
              <span>{item.citizen?.healthUnitPsfId ?? 'Sem unidade'} · {item.status.replaceAll('_', ' ')}</span>
            </button>
          ))}
        </aside>
        <div className="panel support-admin__thread">
          {!selected ? <p>Selecione uma conversa.</p> : (
            <>
              <header className="support-admin__thread-header">
                <div><h2>{selected.citizen?.name}</h2><p>{selected.citizen?.phone} · {selected.citizen?.healthUnitPsfId}</p></div>
                <div>
                  <button type="button" onClick={() => void updateStatus('EM_ATENDIMENTO')}>Assumir</button>
                  <button type="button" className="btn-secondary" onClick={() => void updateStatus('FINALIZADA')}>Finalizar</button>
                </div>
              </header>
              <SupportChatThread conversation={selected} token={token} ownType="ATENDENTE" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
