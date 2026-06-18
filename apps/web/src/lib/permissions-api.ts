import type { MenuKey } from '@zeladoria/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function fetchMenuPermissionsMatrix(accessToken?: string) {
  const response = await fetch(`${API_URL}/permissions/menus`, {
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
  const response = await fetch(`${API_URL}/permissions/menus/me`, {
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
  const response = await fetch(`${API_URL}/permissions/menus`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(matrix)
  });
  if (!response.ok) throw new Error('Não foi possível salvar permissões.');
  return response.json();
}
