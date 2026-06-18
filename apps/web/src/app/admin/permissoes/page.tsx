'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMenuPermissionsMatrix, saveMenuPermissionsMatrix } from '../../../lib/permissions-api';
import { getStoredAccessToken } from '../../../lib/api';

import { getRoleLabel, PERMISSION_MATRIX_ROLES } from '@zeladoria/shared';

export default function AdminPermissionsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>> | null>(null);

  const permissions = useQuery({
    queryKey: ['menu-permissions'],
    queryFn: () => fetchMenuPermissionsMatrix(getStoredAccessToken()),
    staleTime: 30_000
  });

  const matrix = draft ?? permissions.data?.matrix ?? {};
  const catalog = permissions.data?.catalog ?? [];
  const roles = PERMISSION_MATRIX_ROLES;

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, typeof catalog> = {};
    for (const item of catalog) {
      groups[item.group] ??= [];
      groups[item.group].push(item);
    }
    return groups;
  }, [catalog]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, Record<string, boolean>> = {};
      for (const role of PERMISSION_MATRIX_ROLES) {
        if (matrix[role]) payload[role] = matrix[role];
      }
      return saveMenuPermissionsMatrix(payload, getStoredAccessToken());
    },
    onSuccess: async () => {
      setDraft(null);
      setSuccess('Permissões salvas. Usuários precisam recarregar a sessão para ver o menu atualizado.');
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['menu-permissions'] });
    },
    onError: () => setError('Não foi possível salvar as permissões.')
  });

  function toggle(role: string, menuKey: string) {
    if (!PERMISSION_MATRIX_ROLES.includes(role as (typeof PERMISSION_MATRIX_ROLES)[number])) return;
    setDraft((current) => {
      const base = current ?? structuredClone(matrix);
      base[role] ??= {};
      base[role][menuKey] = !base[role][menuKey];
      return base;
    });
  }

  if (permissions.isLoading) {
    return (
      <section className="panel">
        <p>Carregando permissões...</p>
      </section>
    );
  }

  return (
    <section className="panel admin-page">
      <p className="eyebrow">Administração</p>
      <h1>Permissões de menu</h1>
      <p className="scheduling-copy">
        Defina quais telas cada perfil pode acessar. Secretarias podem ver apenas as demandas da própria unidade;
        o menu controla o que aparece no sistema web e no app do cidadão.
      </p>

      {error ? <p className="login-error">{error}</p> : null}
      {success ? <p className="success-message">{success}</p> : null}

      {Object.entries(groupedCatalog).map(([group, items]) => (
        <div key={group} className="permissions-group">
          <h3>
            {group === 'operacao'
              ? 'Operação'
              : group === 'gestao'
                ? 'Gestão'
                : group === 'admin'
                  ? 'Administração'
                  : 'App do cidadão (PWA)'}
          </h3>
          {group === 'cidadao' ? (
            <p className="scheduling-copy">
              Controla quais abas aparecem no aplicativo do cidadão. Afeta todos os usuários com perfil Cidadão.
              Após salvar, peça para sair e entrar de novo no app.
            </p>
          ) : null}
          <div className="permissions-table-wrap">
            <table className="permissions-table">
              <thead>
                <tr>
                  <th>Menu</th>
                  {roles.map((role) => (
                    <th key={role}>{getRoleLabel(role)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>{item.label}</td>
                    {roles.map((role) => (
                      <td key={`${role}-${item.key}`}>
                        <input
                          type="checkbox"
                          checked={Boolean(matrix[role]?.[item.key])}
                          onChange={() => toggle(role, item.key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Salvando...' : 'Salvar permissões'}
        </button>
      </div>
    </section>
  );
}
