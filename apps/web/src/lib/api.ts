const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

async function safeJson<T>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

function authHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function fetchDashboardData(accessToken?: string) {
  const [occurrencesRes, citizensRes, usersRes, categoriesRes] = await Promise.allSettled([
    fetch(`${API_URL}/occurrences`, { cache: 'no-store', headers: authHeaders(accessToken) }),
    fetch(`${API_URL}/citizens`, { cache: 'no-store', headers: authHeaders(accessToken) }),
    fetch(`${API_URL}/users`, { cache: 'no-store', headers: authHeaders(accessToken) }),
    fetch(`${API_URL}/categories`, { cache: 'no-store' })
  ]);

  const occurrences = occurrencesRes.status === 'fulfilled' ? await safeJson<any[]>(occurrencesRes.value) : null;
  const citizens = citizensRes.status === 'fulfilled' ? await safeJson<any[]>(citizensRes.value) : null;
  const users = usersRes.status === 'fulfilled' ? await safeJson<any[]>(usersRes.value) : null;
  const categories = categoriesRes.status === 'fulfilled' ? await safeJson<any[]>(categoriesRes.value) : null;

  return {
    occurrences: occurrences ?? [],
    citizens: citizens ?? [],
    users: users ?? [],
    categories: categories ?? []
  };
}

export async function fetchServiceOrders(accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const occurrences = await safeJson<any[]>(response);
  return (occurrences ?? [])
    .flatMap((occurrence) =>
      (occurrence.serviceOrders ?? []).map((serviceOrder: any) => ({
        ...serviceOrder,
        occurrenceProtocol: occurrence.protocol,
        occurrenceTitle: occurrence.title ?? occurrence.description,
        occurrenceStatus: occurrence.status,
        occurrenceId: occurrence.id
      }))
    )
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
}

export async function startServiceOrder(id: string, accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences/service-orders/${id}/start`, {
    method: 'PATCH',
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error('Falha ao iniciar OS');
  return response.json();
}

export async function registerServiceOrderExecution(
  id: string,
  payload: Record<string, unknown>,
  accessToken?: string
) {
  const response = await fetch(`${API_URL}/occurrences/service-orders/${id}/execution`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Falha ao registrar execução');
  return response.json();
}

export async function finishServiceOrder(id: string, payload: Record<string, unknown>, accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences/service-orders/${id}/finish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Falha ao finalizar OS');
  return response.json();
}

export async function fetchOccurrences(accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const occurrences = await safeJson<any[]>(response);
  return occurrences ?? [];
}

export async function fetchCategories(accessToken?: string) {
  const response = await fetch(`${API_URL}/categories`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const categories = await safeJson<any[]>(response);
  return categories ?? [];
}

export async function fetchNeighborhoods(accessToken?: string) {
  const response = await fetch(`${API_URL}/neighborhoods`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const neighborhoods = await safeJson<any[]>(response);
  return neighborhoods ?? [];
}

export async function createOccurrence(payload: Record<string, unknown>, accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Falha ao criar ocorrência');
  }

  return response.json();
}

export async function fetchMyOccurrences(accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences/mine`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const occurrences = await safeJson<any[]>(response);
  return occurrences ?? [];
}

export async function fetchOccurrenceByProtocol(protocol: string, accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences/protocol/${encodeURIComponent(protocol)}`, {
    cache: 'no-store',
    headers: authHeaders(accessToken)
  });
  return safeJson<any>(response);
}

export async function updateOccurrenceStatus(id: string, status: string, accessToken?: string) {
  const response = await fetch(`${API_URL}/occurrences/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error('Falha ao atualizar ocorrência');
  }

  return response.json();
}
