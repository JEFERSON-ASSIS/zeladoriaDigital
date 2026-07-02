import type { HealthUnitPsfId } from '@zeladoria/shared';
import { getStoredAccessToken } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export type AdminCitizenRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  healthUnitPsfId: string | null;
  lgpdAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchCitizens(accessToken?: string, healthUnitPsfId?: HealthUnitPsfId | 'all') {
  const params = new URLSearchParams();
  if (healthUnitPsfId && healthUnitPsfId !== 'all') {
    params.set('healthUnitPsfId', healthUnitPsfId);
  }

  const query = params.toString();
  const response = await fetch(`${API_URL}/citizens${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${accessToken ?? getStoredAccessToken()}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar os cidadãos.');
  }

  return response.json() as Promise<AdminCitizenRecord[]>;
}

export async function updateCitizenHealthUnit(
  id: string,
  healthUnitPsfId: HealthUnitPsfId | null,
  accessToken?: string
) {
  const response = await fetch(`${API_URL}/citizens/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken ?? getStoredAccessToken()}`
    },
    body: JSON.stringify({ healthUnitPsfId })
  });

  if (!response.ok) {
    throw new Error('Não foi possível atualizar a unidade do cidadão.');
  }

  return response.json() as Promise<AdminCitizenRecord>;
}
