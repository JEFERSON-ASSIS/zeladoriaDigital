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

export async function fetchUsers(accessToken?: string) {
  const response = await fetch(`${API_URL}/users`, { cache: 'no-store', headers: authHeaders(accessToken) });
  const users = await safeJson<any[]>(response);
  return users ?? [];
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

async function fetchAdmin<T>(path: string, accessToken?: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    headers: {
      ...authHeaders(accessToken),
      ...(init?.headers ?? {})
    },
    ...init
  });
  return safeJson<T>(response);
}

function buildQueryString(filters: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getStoredAccessToken() {
  return typeof window === 'undefined' ? undefined : JSON.parse(window.localStorage.getItem('zeladoria.session') ?? 'null')?.accessToken;
}

export async function fetchExecutiveDashboard(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any>(`/admin/dashboard/executive${buildQueryString(filters)}`, accessToken)) ?? {};
}

export async function fetchStatusIndicators(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/indicators/status${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchDepartmentIndicators(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/indicators/departments${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchCategoryIndicators(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/indicators/categories${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchNeighborhoodIndicators(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/indicators/neighborhoods${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchRanking(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/ranking${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchAlerts(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any[]>(`/admin/alerts${buildQueryString(filters)}`, accessToken)) ?? [];
}

export async function fetchReportsSummary(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any>('/admin/reports/generate', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  })) ?? {};
}

export async function fetchExecutiveSummary(filters: Record<string, unknown> = {}, accessToken?: string) {
  return (await fetchAdmin<any>('/admin/ai/executive-summary', accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  })) ?? {};
}

export async function fetchPublicTransparency(filters: Record<string, unknown> = {}) {
  return (await fetchAdmin<any>(`/transparency${buildQueryString(filters)}`)) ?? {};
}

export async function exportAdminGrid(
  format: 'pdf' | 'csv' | 'xlsx',
  filters: Record<string, unknown>,
  accessToken?: string
) {
  const response = await fetch(`${API_URL}/admin/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify({ format, filters })
  });

  if (!response.ok) {
    throw new Error('Falha ao exportar grid');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filenameMatch = disposition.match(/filename="([^"]+)"/i);

  return {
    blob,
    filename: filenameMatch?.[1] ?? `export.${format}`
  };
}
