import type { SessionRole } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
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
  const response = await fetch(`${API_URL}/auth/me`, {
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
  }>;
}
