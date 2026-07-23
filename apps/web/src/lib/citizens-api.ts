import type { HealthUnitPsfId } from '@zeladoria/shared';
import { getPublicApiUrl } from './api-base-url';
import { getStoredAccessToken } from './api';

export type AdminCitizenRecord = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  healthUnitPsfId: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  lgpdAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCitizenPayload = {
  name?: string;
  healthUnitPsfId?: HealthUnitPsfId | null;
  blocked?: boolean;
  blockedReason?: string | null;
};

async function readCitizenError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // ignore
  }
  return fallback;
}

export async function fetchCitizens(accessToken?: string, healthUnitPsfId?: HealthUnitPsfId | 'all') {
  const params = new URLSearchParams();
  if (healthUnitPsfId && healthUnitPsfId !== 'all') {
    params.set('healthUnitPsfId', healthUnitPsfId);
  }

  const query = params.toString();
  const response = await fetch(`${getPublicApiUrl()}/citizens${query ? `?${query}` : ''}`, {
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

export async function updateCitizen(id: string, payload: UpdateCitizenPayload, accessToken?: string) {
  const response = await fetch(`${getPublicApiUrl()}/citizens/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken ?? getStoredAccessToken()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await readCitizenError(response, 'Não foi possível atualizar o cidadão.'));
  }

  return response.json() as Promise<AdminCitizenRecord>;
}

export async function updateCitizenHealthUnit(
  id: string,
  healthUnitPsfId: HealthUnitPsfId | null,
  name?: string,
  accessToken?: string
) {
  return updateCitizen(id, { healthUnitPsfId, name }, accessToken);
}

export async function setCitizenBlocked(
  id: string,
  blocked: boolean,
  blockedReason?: string | null,
  accessToken?: string
) {
  return updateCitizen(
    id,
    {
      blocked,
      blockedReason: blocked ? blockedReason ?? null : null
    },
    accessToken
  );
}

export async function deleteCitizen(id: string, accessToken?: string) {
  const response = await fetch(`${getPublicApiUrl()}/citizens/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken ?? getStoredAccessToken()}`
    }
  });

  if (!response.ok) {
    throw new Error(await readCitizenError(response, 'Não foi possível excluir o cidadão.'));
  }

  return response.json() as Promise<AdminCitizenRecord>;
}

export function isCitizenBlocked(citizen: Pick<AdminCitizenRecord, 'blockedAt'>) {
  return Boolean(citizen.blockedAt);
}

export type CitizenOccurrenceSummary = {
  id: string;
  protocol: string;
  title: string | null;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type CitizenActivity = {
  occurrences: CitizenOccurrenceSummary[];
  pushSubscriptionsCount: number;
};

export async function fetchCitizenActivity(id: string, accessToken?: string) {
  const response = await fetch(`${getPublicApiUrl()}/citizens/${id}/activity`, {
    headers: {
      Authorization: `Bearer ${accessToken ?? getStoredAccessToken()}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar a atividade do cidadão.');
  }

  return response.json() as Promise<CitizenActivity>;
}
