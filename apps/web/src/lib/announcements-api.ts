const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export type CitizenAnnouncement = {
  id: string;
  title: string;
  summary: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  published: boolean;
  publishedAt?: string | null;
  pushSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementPushResult = {
  sent: number;
  skipped?: 'missing-vapid';
};

export type AnnouncementWriteResult = CitizenAnnouncement & {
  push?: AnnouncementPushResult | null;
};

export type AnnouncementPushStatus = {
  configured: boolean;
  subscriptions: number;
};

export function formatAnnouncementPushMessage(wantedPush: boolean, push?: AnnouncementPushResult | null) {
  if (!wantedPush) return null;
  if (!push || push.skipped === 'missing-vapid') {
    return 'Push não enviado: configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no servidor da API.';
  }
  if (push.sent === 0) {
    return 'Push não enviado: nenhum celular inscrito ainda (peça ao cidadão ativar notificações no app).';
  }
  return `Push enviado para ${push.sent} dispositivo(s).`;
}

export function resolveAnnouncementAssetUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (body.message) return body.message;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export async function fetchAnnouncementPushStatus(accessToken?: string) {
  const response = await fetch(`${API_URL}/announcements/push-status`, {
    headers: authHeaders(accessToken),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Não foi possível verificar o push.');
  return response.json() as Promise<AnnouncementPushStatus>;
}

export async function fetchAnnouncementFeed(accessToken?: string) {
  const response = await fetch(`${API_URL}/announcements/feed`, {
    headers: authHeaders(accessToken),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Não foi possível carregar os avisos.');
  return response.json() as Promise<CitizenAnnouncement[]>;
}

export async function fetchAdminAnnouncements(accessToken?: string) {
  const response = await fetch(`${API_URL}/announcements`, {
    headers: authHeaders(accessToken),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Não foi possível carregar avisos.');
  return response.json() as Promise<CitizenAnnouncement[]>;
}

export async function createAnnouncement(
  payload: {
    title: string;
    summary: string;
    body?: string;
    imageUrl?: string;
    linkUrl?: string;
    published?: boolean;
    sendPush?: boolean;
  },
  accessToken?: string
) {
  const response = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Não foi possível criar o aviso.'));
  return response.json() as Promise<AnnouncementWriteResult>;
}

export async function updateAnnouncement(
  id: string,
  payload: Partial<{
    title: string;
    summary: string;
    body: string;
    imageUrl: string;
    linkUrl: string;
    published: boolean;
  }>,
  accessToken?: string
) {
  const response = await fetch(`${API_URL}/announcements/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Não foi possível atualizar o aviso.'));
  return response.json() as Promise<CitizenAnnouncement>;
}

export async function publishAnnouncement(id: string, sendPush: boolean, accessToken?: string) {
  const response = await fetch(`${API_URL}/announcements/${id}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(accessToken)
    },
    body: JSON.stringify({ sendPush })
  });
  if (!response.ok) throw new Error(await readApiError(response, 'Não foi possível publicar o aviso.'));
  return response.json() as Promise<AnnouncementWriteResult>;
}

export async function deleteAnnouncement(id: string, accessToken?: string) {
  const response = await fetch(`${API_URL}/announcements/${id}`, {
    method: 'DELETE',
    headers: authHeaders(accessToken)
  });
  if (!response.ok) throw new Error('Não foi possível excluir o aviso.');
  return response.json();
}

export async function uploadAnnouncementImage(file: File, accessToken?: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/announcements/upload-image`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: formData
  });

  if (!response.ok) throw new Error('Não foi possível enviar a imagem.');
  return response.json() as Promise<{ imageUrl: string }>;
}

export async function subscribeCitizenPush(
  payload: { endpoint: string; p256dh: string; auth: string },
  accessToken: string
) {
  const response = await fetch(`${API_URL}/announcements/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error('Não foi possível registrar push.');
  return response.json();
}
