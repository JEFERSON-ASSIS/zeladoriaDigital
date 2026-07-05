'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HEALTH_UNIT_LABELS,
  HEALTH_UNIT_PSF_IDS,
  getHealthUnitLabel,
  type HealthUnitPsfId
} from '@zeladoria/shared';
import {
  deleteCitizen,
  fetchCitizens,
  isCitizenBlocked,
  setCitizenBlocked,
  updateCitizenHealthUnit,
  type AdminCitizenRecord
} from '../../../lib/citizens-api';
import { formatCpf, formatPhone } from '../../../lib/citizen-access-api';
import { getStoredAccessToken } from '../../../lib/api';
import { getSession } from '../../../lib/auth';

type ListFilter = 'all' | HealthUnitPsfId | 'sem' | 'blocked';

type ConfirmAction =
  | { type: 'block'; citizen: AdminCitizenRecord }
  | { type: 'unblock'; citizen: AdminCitizenRecord }
  | { type: 'delete'; citizen: AdminCitizenRecord };

const FILTER_CHIPS: { value: ListFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...HEALTH_UNIT_PSF_IDS.map((id) => ({ value: id, label: HEALTH_UNIT_LABELS[id] })),
  { value: 'sem', label: 'Sem unidade' },
  { value: 'blocked', label: 'Bloqueados' }
];

const KPI_FILTERS: { value: ListFilter; label: string; tone: 'neutral' | 'success' | 'danger' | 'warning' }[] = [
  { value: 'all', label: 'Total', tone: 'neutral' },
  { value: 'blocked', label: 'Bloqueados', tone: 'danger' },
  { value: 'sem', label: 'Sem unidade', tone: 'warning' }
];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function normalizeSearch(value: string) {
  return value.replace(/\D/g, '');
}

function unitBadgeClass(psfId: string | null) {
  if (!psfId || !HEALTH_UNIT_PSF_IDS.includes(psfId as HealthUnitPsfId)) {
    return 'health-citizens-badge health-citizens-badge--muted';
  }
  return `health-citizens-badge health-citizens-badge--${psfId}`;
}

function normalizeCitizenName(name: string | null | undefined) {
  return name?.trim().replace(/\s+/g, ' ') ?? '';
}

function isGenericCitizenName(name: string | null | undefined) {
  const normalized = normalizeCitizenName(name).toLowerCase();
  return !normalized || normalized === 'cidadão' || normalized === 'cidadao';
}

function getCitizenDisplayName(citizen: AdminCitizenRecord) {
  return isGenericCitizenName(citizen.name) ? 'Nome não informado' : citizen.name;
}

function closeActionsMenu(event: React.MouseEvent<HTMLButtonElement>) {
  const details = event.currentTarget.closest('details');
  if (details) details.open = false;
}

function CitizenActionsMenu({
  citizen,
  blocked,
  isAdmin,
  onEdit,
  onBlock,
  onUnblock,
  onDelete
}: {
  citizen: AdminCitizenRecord;
  blocked: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
}) {
  return (
    <details className="health-citizens-menu">
      <summary aria-label={`Ações para ${getCitizenDisplayName(citizen)}`}>Ações</summary>
      <div className="health-citizens-menu__panel">
        <button
          type="button"
          onClick={(event) => {
            closeActionsMenu(event);
            onEdit();
          }}
        >
          Editar cadastro
        </button>
        {blocked ? (
          <button
            type="button"
            onClick={(event) => {
              closeActionsMenu(event);
              onUnblock();
            }}
          >
            Desbloquear acesso
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              closeActionsMenu(event);
              onBlock();
            }}
          >
            Bloquear acesso
          </button>
        )}
        {isAdmin ? (
          <button
            type="button"
            className="is-danger"
            onClick={(event) => {
              closeActionsMenu(event);
              onDelete();
            }}
          >
            Excluir cadastro
          </button>
        ) : null}
      </div>
    </details>
  );
}

export default function AdminHealthCitizensPage() {
  const queryClient = useQueryClient();
  const session = getSession();
  const isAdmin = session?.user.role === 'ADMIN';

  const [filter, setFilter] = useState<ListFilter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminCitizenRecord | null>(null);
  const [nextName, setNextName] = useState('');
  const [nextUnit, setNextUnit] = useState<HealthUnitPsfId>('psf1');
  const [blockReason, setBlockReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 6000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const citizens = useQuery({
    queryKey: ['admin-health-citizens'],
    queryFn: () => fetchCitizens(getStoredAccessToken()),
    staleTime: 20_000
  });

  const rows = citizens.data ?? [];

  const counts = useMemo(() => {
    const active = rows.filter((item) => !isCitizenBlocked(item)).length;
    return {
      all: rows.length,
      active,
      sem: rows.filter((item) => !item.healthUnitPsfId).length,
      blocked: rows.filter((item) => isCitizenBlocked(item)).length,
      ...Object.fromEntries(
        HEALTH_UNIT_PSF_IDS.map((id) => [id, rows.filter((item) => item.healthUnitPsfId === id).length])
      )
    } as Record<ListFilter | 'active', number>;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const digits = normalizeSearch(search);

    return rows.filter((item) => {
      if (filter === 'sem' && item.healthUnitPsfId) return false;
      if (filter === 'blocked' && !isCitizenBlocked(item)) return false;
      if (filter !== 'all' && filter !== 'sem' && filter !== 'blocked' && item.healthUnitPsfId !== filter) {
        return false;
      }

      if (!needle) return true;

      const haystack = [item.name, getCitizenDisplayName(item), item.phone ?? '', item.cpf ?? ''].join(' ').toLowerCase();
      if (haystack.includes(needle)) return true;
      if (digits && (item.phone?.includes(digits) || item.cpf?.includes(digits))) return true;
      return false;
    });
  }, [rows, filter, search]);

  async function refreshList(message?: string) {
    await queryClient.invalidateQueries({ queryKey: ['admin-health-citizens'] });
    if (message) setSuccess(message);
    setError(null);
  }

  const saveUnitMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Nenhum cidadão selecionado.');
      const normalizedName = normalizeCitizenName(nextName);
      if (normalizedName.length < 3) {
        throw new Error('Informe o nome completo do cidadão.');
      }
      return updateCitizenHealthUnit(editing.id, nextUnit, normalizedName, getStoredAccessToken());
    },
    onSuccess: async () => {
      setEditing(null);
      await refreshList('Cadastro atualizado. O cidadão precisa sair e entrar de novo no app.');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Não foi possível salvar o cadastro.')
  });

  const confirmMutation = useMutation({
    mutationFn: async (action: ConfirmAction) => {
      if (action.type === 'delete') {
        return deleteCitizen(action.citizen.id, getStoredAccessToken());
      }
      if (action.type === 'block') {
        return setCitizenBlocked(action.citizen.id, true, blockReason.trim() || null, getStoredAccessToken());
      }
      return setCitizenBlocked(action.citizen.id, false, null, getStoredAccessToken());
    },
    onSuccess: async (_, action) => {
      setConfirmAction(null);
      setBlockReason('');
      if (action.type === 'delete') {
        await refreshList('Cadastro excluído permanentemente.');
        return;
      }
      if (action.type === 'block') {
        await refreshList('Cidadão bloqueado. Ele não conseguirá entrar no app.');
        return;
      }
      await refreshList('Bloqueio removido. O cidadão pode entrar no app novamente.');
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Não foi possível concluir a operação.')
  });

  function openEdit(citizen: AdminCitizenRecord) {
    setEditing(citizen);
    setNextName(isGenericCitizenName(citizen.name) ? '' : citizen.name);
    setNextUnit((citizen.healthUnitPsfId as HealthUnitPsfId) ?? 'psf1');
    setSuccess(null);
    setError(null);
  }

  function openConfirm(action: ConfirmAction) {
    setConfirmAction(action);
    setBlockReason('');
    setSuccess(null);
    setError(null);
  }

  const confirmCopy = confirmAction
    ? {
        block: {
          title: 'Bloquear cidadão',
          description: 'O cidadão não poderá entrar no app enquanto estiver bloqueado.',
          confirmLabel: 'Bloquear',
          destructive: true
        },
        unblock: {
          title: 'Desbloquear cidadão',
          description: 'O cidadão voltará a acessar o app normalmente.',
          confirmLabel: 'Desbloquear',
          destructive: false
        },
        delete: {
          title: 'Excluir cadastro',
          description: 'Esta ação remove o cidadão do sistema. Solicitações antigas permanecem, mas sem vínculo.',
          confirmLabel: 'Excluir',
          destructive: true,
          warning: 'Esta ação não pode ser desfeita.'
        }
      }[confirmAction.type]
    : null;

  function renderCitizenPerson(citizen: AdminCitizenRecord) {
    return (
      <div className="health-citizens-person">
        <strong>{getCitizenDisplayName(citizen)}</strong>
        {isGenericCitizenName(citizen.name) ? <span>Nome pendente</span> : null}
        <span>{citizen.phone ? formatPhone(citizen.phone) : 'Sem celular'}</span>
        <span>{citizen.cpf ? formatCpf(citizen.cpf) : 'Sem CPF'}</span>
      </div>
    );
  }

  function renderCitizenCardMeta(citizen: AdminCitizenRecord, blocked: boolean) {
    return (
      <>
        {renderCitizenPerson(citizen)}
        <div className="health-citizens-meta-row">
          <span className={unitBadgeClass(citizen.healthUnitPsfId)}>{getHealthUnitLabel(citizen.healthUnitPsfId)}</span>
          {blocked ? (
            <span className="health-citizens-status health-citizens-status--blocked">
              Bloqueado
              {citizen.blockedReason ? <small title={citizen.blockedReason}>{citizen.blockedReason}</small> : null}
            </span>
          ) : (
            <span className="health-citizens-status health-citizens-status--active">Ativo</span>
          )}
        </div>
      </>
    );
  }

  return (
    <section className="admin-shell health-citizens-page">
      <header className="hero health-citizens-hero">
        <p className="eyebrow">Administração</p>
        <h1>Cidadãos — Unidades de saúde</h1>
        <p>Gerencie cadastros do app: unidade vinculada, bloqueio de acesso e exclusão de contas.</p>
      </header>

      {error ? (
        <div className="health-citizens-alert health-citizens-alert--error" role="alert">
          {error}
          <button type="button" aria-label="Fechar erro" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      ) : null}

      {success ? (
        <div className="health-citizens-alert health-citizens-alert--success" role="status">
          {success}
          <button type="button" aria-label="Fechar aviso" onClick={() => setSuccess(null)}>
            ×
          </button>
        </div>
      ) : null}

      <div className="health-citizens-kpis">
        <button
          type="button"
          className={`health-citizens-kpi health-citizens-kpi--neutral ${filter === 'all' && !search ? 'is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>Total</span>
          <strong>{counts.all}</strong>
        </button>
        <div className="health-citizens-kpi health-citizens-kpi--success">
          <span>Ativos</span>
          <strong>{counts.active}</strong>
        </div>
        {KPI_FILTERS.filter((item) => item.value !== 'all').map((kpi) => (
          <button
            key={kpi.value}
            type="button"
            className={`health-citizens-kpi health-citizens-kpi--${kpi.tone} ${filter === kpi.value ? 'is-active' : ''}`}
            onClick={() => setFilter(kpi.value)}
          >
            <span>{kpi.label}</span>
            <strong>{counts[kpi.value] ?? 0}</strong>
          </button>
        ))}
      </div>

      <section className="panel health-citizens-panel">
        <div className="health-citizens-toolbar">
          <label className="health-citizens-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, celular ou CPF..."
              aria-label="Buscar cidadão"
            />
          </label>
          <p className="health-citizens-toolbar__meta">
            {filteredRows.length} resultado(s)
            {filter !== 'all' ? ` · filtro: ${FILTER_CHIPS.find((item) => item.value === filter)?.label ?? filter}` : ''}
          </p>
        </div>

        <div className="health-citizens-chips" role="tablist" aria-label="Filtrar cidadãos">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              role="tab"
              aria-selected={filter === chip.value}
              className={`health-citizens-chip ${filter === chip.value ? 'is-active' : ''}`}
              onClick={() => setFilter(chip.value)}
            >
              <span>{chip.label}</span>
              <strong>{counts[chip.value] ?? 0}</strong>
            </button>
          ))}
        </div>

        {citizens.isLoading ? <p className="health-citizens-empty">Carregando cidadãos...</p> : null}
        {citizens.isError ? <p className="login-error">Não foi possível carregar a lista.</p> : null}

        {!citizens.isLoading && !citizens.isError ? (
          <>
            <div className="permissions-table-wrap health-citizens-table-wrap health-citizens-table-wrap--desktop">
              <table className="permissions-table health-citizens-table">
                <thead>
                  <tr>
                    <th>Cidadão</th>
                    <th>Unidade</th>
                    <th>Status</th>
                    <th>Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="health-citizens-empty">
                        Nenhum cidadão encontrado para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((citizen) => {
                      const blocked = isCitizenBlocked(citizen);
                      return (
                        <tr key={citizen.id} className={blocked ? 'health-citizens-row--blocked' : undefined}>
                          <td>{renderCitizenPerson(citizen)}</td>
                          <td>
                            <span className={unitBadgeClass(citizen.healthUnitPsfId)}>
                              {getHealthUnitLabel(citizen.healthUnitPsfId)}
                            </span>
                          </td>
                          <td>
                            {blocked ? (
                              <div className="health-citizens-status health-citizens-status--blocked">
                                <span>Bloqueado</span>
                                {citizen.blockedReason ? (
                                  <small title={citizen.blockedReason}>{citizen.blockedReason}</small>
                                ) : null}
                              </div>
                            ) : (
                              <span className="health-citizens-status health-citizens-status--active">Ativo</span>
                            )}
                          </td>
                          <td>{formatDate(citizen.createdAt)}</td>
                          <td>
                            <CitizenActionsMenu
                              citizen={citizen}
                              blocked={blocked}
                              isAdmin={isAdmin}
                              onEdit={() => openEdit(citizen)}
                              onBlock={() => openConfirm({ type: 'block', citizen })}
                              onUnblock={() => openConfirm({ type: 'unblock', citizen })}
                              onDelete={() => openConfirm({ type: 'delete', citizen })}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="health-citizens-cards health-citizens-cards--mobile">
              {filteredRows.length === 0 ? (
                <p className="health-citizens-empty">Nenhum cidadão encontrado para este filtro.</p>
              ) : (
                filteredRows.map((citizen) => {
                  const blocked = isCitizenBlocked(citizen);
                  return (
                    <article key={citizen.id} className={`health-citizens-card ${blocked ? 'is-blocked' : ''}`}>
                      {renderCitizenCardMeta(citizen, blocked)}
                      <p className="health-citizens-card__date">Cadastro: {formatDate(citizen.createdAt)}</p>
                      <CitizenActionsMenu
                        citizen={citizen}
                        blocked={blocked}
                        isAdmin={isAdmin}
                        onEdit={() => openEdit(citizen)}
                        onBlock={() => openConfirm({ type: 'block', citizen })}
                        onUnblock={() => openConfirm({ type: 'unblock', citizen })}
                        onDelete={() => openConfirm({ type: 'delete', citizen })}
                      />
                    </article>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </section>

      {editing ? (
        <div className="health-citizens-modal-backdrop" onClick={() => setEditing(null)} role="presentation">
          <section className="health-citizens-modal" onClick={(event) => event.stopPropagation()}>
            <header className="health-citizens-modal__header">
              <div>
                <p className="eyebrow">Cadastro do cidadão</p>
                <h3>Editar cadastro</h3>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Fechar
              </button>
            </header>
            <p className="health-citizens-modal__person">
              <strong>{getCitizenDisplayName(editing)}</strong>
              <span>
                {editing.phone ? formatPhone(editing.phone) : 'Sem celular'} ·{' '}
                {editing.cpf ? formatCpf(editing.cpf) : 'Sem CPF'}
              </span>
            </p>
            <label className="form-field">
              <span>Nome completo</span>
              <input
                value={nextName}
                onChange={(event) => setNextName(event.target.value)}
                placeholder="Nome completo do cidadão"
                autoComplete="name"
                maxLength={120}
              />
            </label>
            <div className="health-citizens-unit-grid">
              {HEALTH_UNIT_PSF_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`health-citizens-unit-option ${nextUnit === id ? 'is-selected' : ''}`}
                  onClick={() => setNextUnit(id)}
                >
                  <span className={unitBadgeClass(id)}>{HEALTH_UNIT_LABELS[id]}</span>
                </button>
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button type="button" disabled={saveUnitMutation.isPending} onClick={() => saveUnitMutation.mutate()}>
                {saveUnitMutation.isPending ? 'Salvando...' : 'Salvar cadastro'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {confirmAction && confirmCopy ? (
        <div
          className="health-citizens-modal-backdrop"
          onClick={() => !confirmMutation.isPending && setConfirmAction(null)}
          role="presentation"
        >
          <section className="health-citizens-modal health-citizens-modal--confirm" onClick={(event) => event.stopPropagation()}>
            <header className="health-citizens-modal__header">
              <div>
                <p className="eyebrow">{confirmCopy.destructive ? 'Atenção' : 'Confirmação'}</p>
                <h3>{confirmCopy.title}</h3>
              </div>
              <button
                type="button"
                className="btn-secondary"
                disabled={confirmMutation.isPending}
                onClick={() => setConfirmAction(null)}
              >
                Fechar
              </button>
            </header>
            <p className="health-citizens-modal__description">{confirmCopy.description}</p>
            <dl className="citizen-dialog__details">
              <div className="citizen-dialog__detail-row">
                <dt>Nome</dt>
                <dd>{getCitizenDisplayName(confirmAction.citizen)}</dd>
              </div>
              <div className="citizen-dialog__detail-row">
                <dt>Celular</dt>
                <dd>{confirmAction.citizen.phone ? formatPhone(confirmAction.citizen.phone) : '—'}</dd>
              </div>
              <div className="citizen-dialog__detail-row">
                <dt>Unidade</dt>
                <dd>{getHealthUnitLabel(confirmAction.citizen.healthUnitPsfId)}</dd>
              </div>
            </dl>
            {confirmCopy.warning ? <p className="citizen-dialog__warning">{confirmCopy.warning}</p> : null}
            {confirmAction.type === 'block' ? (
              <label className="form-field">
                <span>Motivo do bloqueio (opcional)</span>
                <input
                  value={blockReason}
                  onChange={(event) => setBlockReason(event.target.value)}
                  placeholder="Ex.: cadastro duplicado, solicitação da unidade..."
                  maxLength={500}
                />
              </label>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={confirmMutation.isPending}
                onClick={() => setConfirmAction(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={confirmCopy.destructive ? 'btn-error' : ''}
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(confirmAction)}
              >
                {confirmMutation.isPending ? 'Processando...' : confirmCopy.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
