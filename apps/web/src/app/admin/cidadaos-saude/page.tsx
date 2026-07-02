'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  HEALTH_UNIT_LABELS,
  HEALTH_UNIT_PSF_IDS,
  getHealthUnitLabel,
  type HealthUnitPsfId
} from '@zeladoria/shared';
import { fetchCitizens, updateCitizenHealthUnit, type AdminCitizenRecord } from '../../../lib/citizens-api';
import { formatCpf, formatPhone } from '../../../lib/citizen-access-api';
import { getStoredAccessToken } from '../../../lib/api';

type UnitFilter = 'all' | HealthUnitPsfId;

const FILTER_OPTIONS: { value: UnitFilter; label: string }[] = [
  { value: 'all', label: 'Todas as unidades' },
  ...HEALTH_UNIT_PSF_IDS.map((id) => ({ value: id, label: HEALTH_UNIT_LABELS[id] }))
];

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function AdminHealthCitizensPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<UnitFilter>('all');
  const [editing, setEditing] = useState<AdminCitizenRecord | null>(null);
  const [nextUnit, setNextUnit] = useState<HealthUnitPsfId>('psf1');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const citizens = useQuery({
    queryKey: ['admin-health-citizens'],
    queryFn: () => fetchCitizens(getStoredAccessToken()),
    staleTime: 20_000
  });

  const filteredRows = useMemo(() => {
    const rows = citizens.data ?? [];
    if (filter === 'all') return rows;
    return rows.filter((item) => item.healthUnitPsfId === filter);
  }, [citizens.data, filter]);

  const counts = useMemo(() => {
    const rows = citizens.data ?? [];
    const byUnit: Record<string, number> = { all: rows.length };
    for (const id of HEALTH_UNIT_PSF_IDS) {
      byUnit[id] = rows.filter((item) => item.healthUnitPsfId === id).length;
    }
    byUnit.sem = rows.filter((item) => !item.healthUnitPsfId).length;
    return byUnit;
  }, [citizens.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('Nenhum cidadão selecionado.');
      return updateCitizenHealthUnit(editing.id, nextUnit, getStoredAccessToken());
    },
    onSuccess: async () => {
      setEditing(null);
      setSuccess('Unidade atualizada. O cidadão precisa sair e entrar de novo no app.');
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-health-citizens'] });
    },
    onError: () => setError('Não foi possível salvar a unidade.')
  });

  function openEdit(citizen: AdminCitizenRecord) {
    setEditing(citizen);
    setNextUnit((citizen.healthUnitPsfId as HealthUnitPsfId) ?? 'psf1');
    setSuccess(null);
    setError(null);
  }

  return (
    <section className="panel admin-page">
      <p className="eyebrow">Administração</p>
      <h1>Cidadãos — Unidades de saúde</h1>
      <p className="scheduling-copy">
        Consulte cidadãos cadastrados pelo app e veja a qual unidade (PSF) cada celular/CPF pertence.
        A unidade é definida no primeiro cadastro pelo link da unidade e só pode ser alterada aqui.
      </p>

      {error ? <p className="login-error">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}

      <div className="health-citizens-summary">
        {FILTER_OPTIONS.map((option) => (
          <div key={option.value} className="health-citizens-summary__card">
            <strong>{option.label}</strong>
            <span>{counts[option.value] ?? 0}</span>
          </div>
        ))}
        <div className="health-citizens-summary__card">
          <strong>Sem unidade</strong>
          <span>{counts.sem ?? 0}</span>
        </div>
      </div>

      <div className="health-citizens-filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={filter === option.value ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {citizens.isLoading ? <p>Carregando cidadãos...</p> : null}
      {citizens.isError ? <p className="login-error">Não foi possível carregar a lista.</p> : null}

      {!citizens.isLoading && !citizens.isError ? (
        <div className="permissions-table-wrap">
          <table className="permissions-table health-citizens-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Celular</th>
                <th>CPF</th>
                <th>Unidade</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(filteredRows).length === 0 ? (
                <tr>
                  <td colSpan={6}>Nenhum cidadão encontrado para este filtro.</td>
                </tr>
              ) : (
                filteredRows.map((citizen) => (
                  <tr key={citizen.id}>
                    <td>{citizen.name}</td>
                    <td>{citizen.phone ? formatPhone(citizen.phone) : '—'}</td>
                    <td>{citizen.cpf ? formatCpf(citizen.cpf) : '—'}</td>
                    <td>{getHealthUnitLabel(citizen.healthUnitPsfId)}</td>
                    <td>{formatDate(citizen.createdAt)}</td>
                    <td>
                      <button type="button" className="btn-secondary" onClick={() => openEdit(citizen)}>
                        Alterar unidade
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {editing ? (
        <div className="health-citizens-edit">
          <h3>Alterar unidade</h3>
          <p>
            <strong>{editing.name}</strong>
            <br />
            {editing.phone ? formatPhone(editing.phone) : 'Sem celular'} ·{' '}
            {editing.cpf ? formatCpf(editing.cpf) : 'Sem CPF'}
          </p>
          <label className="form-field">
            <span>Nova unidade</span>
            <select value={nextUnit} onChange={(event) => setNextUnit(event.target.value as HealthUnitPsfId)}>
              {HEALTH_UNIT_PSF_IDS.map((id) => (
                <option key={id} value={id}>
                  {HEALTH_UNIT_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
              Cancelar
            </button>
            <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar unidade'}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
