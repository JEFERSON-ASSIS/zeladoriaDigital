'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMenuPermissionsMatrix, saveMenuPermissionsMatrix } from '../../../lib/permissions-api';
import { getStoredAccessToken } from '../../../lib/api';

import { getRoleLabel, PERMISSION_MATRIX_ROLES } from '@zeladoria/shared';

type PermissionMatrix = Record<string, Record<string, boolean>>;

function cloneMatrix(source: PermissionMatrix): PermissionMatrix {
  return JSON.parse(JSON.stringify(source)) as PermissionMatrix;
}

function toggleMatrixCell(source: PermissionMatrix, role: string, menuKey: string): PermissionMatrix {
  const next = cloneMatrix(source);
  next[role] ??= {};
  next[role][menuKey] = !Boolean(next[role][menuKey]);
  return next;
}

function buildSavePayload(catalog: Array<{ key: string }>, working: PermissionMatrix): PermissionMatrix {
  const payload: PermissionMatrix = {};

  for (const role of PERMISSION_MATRIX_ROLES) {
    payload[role] = {};
    for (const item of catalog) {
      payload[role][item.key] = Boolean(working[role]?.[item.key]);
    }
  }

  return payload;
}

export default function AdminPermissionsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<PermissionMatrix | null>(null);

  const permissions = useQuery({
    queryKey: ['menu-permissions'],
    queryFn: () => fetchMenuPermissionsMatrix(getStoredAccessToken()),
    staleTime: 30_000
  });

  const serverMatrix = permissions.data?.matrix ?? {};
  const matrix = draft ?? serverMatrix;
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
    mutationFn: async () => {
      const working = draft ?? serverMatrix;
      const payload = buildSavePayload(catalog, working);
      return saveMenuPermissionsMatrix(payload, getStoredAccessToken());
    },
    onSuccess: async () => {
      setDraft(null);
      setSuccess('Permissões salvas. Usuários precisam recarregar a sessão para ver o menu atualizado.');
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ['menu-permissions'] });
    },
    onError: async (err) => {
      setSuccess(null);
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as permissões.');
    }
  });

  function toggle(role: string, menuKey: string) {
    if (!PERMISSION_MATRIX_ROLES.includes(role as (typeof PERMISSION_MATRIX_ROLES)[number])) return;

    setError(null);
    setSuccess(null);

    setDraft((current) => {
      const baseline =
        current ??
        queryClient.getQueryData<Awaited<ReturnType<typeof fetchMenuPermissionsMatrix>>>(['menu-permissions'])
          ?.matrix ??
        serverMatrix;

      return toggleMatrixCell(baseline, role, menuKey);
    });
  }

  if (permissions.isLoading) {
    return (
      <section className="panel">
        <p>Carregando permissões...</p>
      </section>
    );
  }

  if (permissions.isError) {
    return (
      <section className="panel admin-page">
        <p className="login-error">Não foi possível carregar as permissões. Recarregue a página.</p>
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
                    {roles.map((role) => {
                      const checked = Boolean(matrix[role]?.[item.key]);
                      return (
                        <td
                          key={`${role}-${item.key}`}
                          className="permissions-table__cell-toggle"
                          onClick={() => toggle(role, item.key)}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            tabIndex={-1}
                            aria-label={`${item.label} — ${getRoleLabel(role)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button type="button" disabled={saveMutation.isPending || !draft} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? 'Salvando...' : 'Salvar permissões'}
        </button>
        {draft ? (
          <button
            type="button"
            className="btn-secondary"
            disabled={saveMutation.isPending}
            onClick={() => {
              setDraft(null);
              setError(null);
              setSuccess(null);
            }}
          >
            Descartar alterações
          </button>
        ) : null}
      </div>
    </section>
  );
}
