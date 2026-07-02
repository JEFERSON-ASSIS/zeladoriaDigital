import { getPublicApiUrl } from './api-base-url';

export type PushNotificationRecipient = {
  id: string;
  citizenId: string | null;
  phone: string | null;
  cpf: string | null;
  status: 'sent' | 'failed';
  error: string | null;
  sentAt: string;
};

export type PushNotificationLog = {
  id: string;
  source: 'ANNOUNCEMENT' | 'SCHEDULING_REMINDER';
  title: string;
  body: string;
  url: string | null;
  targetCount: number;
  successCount: number;
  failureCount: number;
  announcementId: string | null;
  sentAt: string;
  recipients: PushNotificationRecipient[];
};

function authHeaders(accessToken?: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function fetchPushLogs(accessToken?: string, limit = 50) {
  const response = await fetch(`${getPublicApiUrl()}/push-logs?limit=${limit}`, {
    headers: authHeaders(accessToken),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar o histórico de push.');
  }

  return response.json() as Promise<PushNotificationLog[]>;
}
