import type { MenuKey } from '@zeladoria/shared';
import { getPublicApiUrl } from './api-base-url';
import type { SessionRole } from './auth';

export async function login(email: string, password: string) {
  const response = await fetch(`${getPublicApiUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error('Falha ao autenticar');
  }

  return response.json() as Promise<{
    access_token: string;
    user: { id: string; name: string; email: string; role: SessionRole };
  }>;
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await fetch(`${getPublicApiUrl()}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Sessão inválida');
  }

  return response.json() as Promise<{
    id: string;
    name: string;
    email: string;
    role: SessionRole;
    departmentId?: string | null;
    department?: { id: string; name: string } | null;
    menuKeys?: MenuKey[];
    phone?: string;
    cpf?: string;
    healthUnitPsfId?: string | null;
  }>;
}
