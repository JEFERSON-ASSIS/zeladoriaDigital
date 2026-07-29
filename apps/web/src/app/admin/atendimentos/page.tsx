'use client';

import {
  CheckCircle2,
  Clock3,
  Inbox,
  MessageCircle,
  Plus,
  Search,
  UserRound
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SupportChatThread } from '../../../components/support-chat-thread';
import { SupportChatNotificationButton } from '../../../components/support-chat-notification-button';
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

const STATUS_LABEL: Record<SupportConversation['status'], string> = {
  NOVA: 'Nova',
  EM_ATENDIMENTO: 'Em atendimento',
  FINALIZADA: 'Finalizada'
};

function initials(name?: string | null) {
  return (name ?? 'Cidadão')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export default function SupportAdminPage() {
  const session = getSession();
  const token = session?.accessToken ?? '';
  const [items, setItems] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [error, setError] = useState('');
  const [citizens, setCitizens] = useState<AdminCitizenRecord[]>([]);
  const [newCitizenId, setNewCitizenId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | SupportConversation['status']>('TODAS');
  const [showNewConversation, setShowNewConversation] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const conversations = await listSupportConversations(token);
      setItems(Array.isArray(conversations) ? conversations : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as conversas.');
    }
  }, [token]);

  useEffect(() => {
    void load();
    if (token) {
      void fetchCitizens(token)
        .then((records) => setCitizens(Array.isArray(records) ? records : []))
        .catch(() => undefined);
    }
  }, [load, token]);

  useEffect(() => {
    if (!token) return;
    const socket = connectSupportSocket(token);
    socket.on('conversation:updated', () => void load());
    return () => { socket.disconnect(); };
  }, [load, token]);

  useEffect(() => {
    if (!token || selected || items.length === 0 || typeof window === 'undefined') return;
    const conversationId = new URLSearchParams(window.location.search).get('conversa');
    if (!conversationId || !items.some((item) => item.id === conversationId)) return;
    void getSupportConversation(conversationId, token)
      .then(setSelected)
      .catch(() => setError('Não foi possível abrir a conversa da notificação.'));
  }, [items, selected, token]);

  async function open(item: SupportConversation) {
    try {
      setSelected(await getSupportConversation(item.id, token));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir a conversa.');
    }
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
    setShowNewConversation(false);
    await load();
  }

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'TODAS' || item.status === statusFilter;
    const citizen = item.citizen;
    const searchable = `${citizen?.name ?? ''} ${citizen?.phone ?? ''} ${citizen?.cpf ?? ''}`.toLocaleLowerCase('pt-BR');
    return matchesStatus && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
  const totalNew = items.filter((item) => item.status === 'NOVA').length;
  const totalInProgress = items.filter((item) => item.status === 'EM_ATENDIMENTO').length;

  return (
    <section className="admin-shell support-admin">
      <header className="support-admin__page-header">
        <div>
          <p className="eyebrow">Central de atendimento</p>
          <h1>Conversas com cidadãos</h1>
          <p>Acompanhe solicitações e converse com os usuários do aplicativo.</p>
        </div>
        <div className="support-admin__header-actions">
          {token ? <SupportChatNotificationButton token={token} compact /> : null}
          <button className="btn-primary support-admin__new-button" type="button" onClick={() => setShowNewConversation((current) => !current)}>
            <Plus size={18} aria-hidden="true" />
            Nova conversa
          </button>
        </div>
      </header>

      <div className="support-admin__metrics" aria-label="Resumo dos atendimentos">
        <article>
          <span className="support-admin__metric-icon is-blue"><MessageCircle size={19} /></span>
          <div><strong>{items.length}</strong><span>Total de conversas</span></div>
        </article>
        <article>
          <span className="support-admin__metric-icon is-orange"><Inbox size={19} /></span>
          <div><strong>{totalNew}</strong><span>Aguardando resposta</span></div>
        </article>
        <article>
          <span className="support-admin__metric-icon is-green"><Clock3 size={19} /></span>
          <div><strong>{totalInProgress}</strong><span>Em atendimento</span></div>
        </article>
      </div>

      {error ? <p className="login-error">{error}</p> : null}

      {showNewConversation ? (
        <div className="support-admin__new-conversation">
          <div>
            <strong>Iniciar atendimento</strong>
            <span>Escolha um cidadão cadastrado no aplicativo.</span>
          </div>
          <select value={newCitizenId} onChange={(event) => setNewCitizenId(event.target.value)}>
            <option value="">Selecione um cidadão</option>
            {citizens.map((citizen) => <option key={citizen.id} value={citizen.id}>{citizen.name} · {citizen.phone}</option>)}
          </select>
          <button className="btn-primary" type="button" disabled={!newCitizenId} onClick={() => void startConversation()}>
            Iniciar conversa
          </button>
        </div>
      ) : null}

      <div className="support-admin__layout">
        <aside className="support-admin__inbox">
          <div className="support-admin__inbox-header">
            <div className="support-admin__inbox-title">
              <strong>Caixa de entrada</strong>
              <span>{filteredItems.length} conversa{filteredItems.length === 1 ? '' : 's'}</span>
            </div>
            <label className="support-admin__search">
              <Search size={17} aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cidadão" />
            </label>
            <div className="support-admin__filters">
              {([
                ['TODAS', 'Todas'],
                ['NOVA', 'Novas'],
                ['EM_ATENDIMENTO', 'Em atendimento'],
                ['FINALIZADA', 'Finalizadas']
              ] as const).map(([value, label]) => (
                <button key={value} type="button" className={statusFilter === value ? 'is-active' : ''} onClick={() => setStatusFilter(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="support-admin__list">
            {filteredItems.length === 0 ? (
              <div className="support-admin__empty-list">
                <Inbox size={28} />
                <strong>Nenhuma conversa encontrada</strong>
                <span>Novas mensagens aparecerão aqui.</span>
              </div>
            ) : filteredItems.map((item) => (
              <button key={item.id} type="button" className={selected?.id === item.id ? 'is-active' : ''} onClick={() => void open(item)}>
                <span className="support-admin__avatar">{initials(item.citizen?.name)}</span>
                <span className="support-admin__conversation-copy">
                  <span className="support-admin__conversation-line">
                    <strong>{item.citizen?.name ?? 'Cidadão'}</strong>
                    <time>{new Date(item.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</time>
                  </span>
                  <span className="support-admin__conversation-preview">
                    {item.messages?.[0]?.text ?? (item.messages?.[0]?.type === 'AUDIO'
                      ? 'Mensagem de áudio'
                      : item.messages?.[0]?.type === 'IMAGEM' ? 'Imagem enviada' : 'Conversa iniciada')}
                  </span>
                  <span className={`support-admin__status is-${item.status.toLowerCase()}`}>{STATUS_LABEL[item.status] ?? 'Atendimento'}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="support-admin__thread">
          {!selected ? (
            <div className="support-admin__empty-thread">
              <span><MessageCircle size={30} /></span>
              <h2>Selecione uma conversa</h2>
              <p>Escolha um atendimento na caixa de entrada para visualizar o histórico e responder ao cidadão.</p>
            </div>
          ) : (
            <>
              <header className="support-admin__thread-header">
                <div className="support-admin__thread-person">
                  <span className="support-admin__avatar is-large">{initials(selected.citizen?.name)}</span>
                  <div>
                    <h2>{selected.citizen?.name ?? 'Cidadão'}</h2>
                    <p><UserRound size={14} /> {selected.citizen?.phone ?? 'Telefone não informado'} <span>·</span> {selected.citizen?.healthUnitPsfId ?? 'Sem unidade'}</p>
                  </div>
                </div>
                <div className="support-admin__thread-actions">
                  {selected.status !== 'EM_ATENDIMENTO' ? (
                    <button type="button" className="support-admin__action is-primary" onClick={() => void updateStatus('EM_ATENDIMENTO')}>
                      <MessageCircle size={16} /> Assumir
                    </button>
                  ) : null}
                  {selected.status !== 'FINALIZADA' ? (
                    <button type="button" className="support-admin__action" onClick={() => void updateStatus('FINALIZADA')}>
                      <CheckCircle2 size={16} /> Finalizar
                    </button>
                  ) : null}
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
