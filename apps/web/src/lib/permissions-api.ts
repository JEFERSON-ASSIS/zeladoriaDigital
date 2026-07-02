import type { MenuKey } from '@zeladoria/shared';
import { getPublicApiUrl } from './api-base-url';

export async function fetchMenuPermissionsMatrix(accessToken?: string) {
  const response = await fetch(`${getPublicApiUrl()}/permissions/menus`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Não foi possível carregar permissões.');
  return response.json() as Promise<{
    catalog: Array<{ key: string; label: string; href: string; group: string }>;
    roles: string[];
    matrix: Record<string, Record<string, boolean>>;
  }>;
}

export async function fetchMyMenuPermissions(accessToken: string) {
  const response = await fetch(`${getPublicApiUrl()}/permissions/menus/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar permissões do app.');
  }

  return response.json() as Promise<MenuKey[]>;
}

export async function saveMenuPermissionsMatrix(
  matrix: Record<string, Record<string, boolean>>,
  accessToken?: string
) {
  const response = await fetch(`${getPublicApiUrl()}/permissions/menus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(matrix)
  });
  if (!response.ok) {
    let message = 'Não foi possível salvar permissões.';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch {
      // Mantém mensagem padrão.
    }
    throw new Error(message);
  }
  return response.json();
}
