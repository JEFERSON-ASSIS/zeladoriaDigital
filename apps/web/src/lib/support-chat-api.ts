import { io, type Socket } from 'socket.io-client';
import { getPublicApiUrl } from './api-base-url';

export type SupportMessage = {
  id: string;
  senderType: 'CIDADAO' | 'ATENDENTE';
  type: 'TEXTO' | 'IMAGEM' | 'AUDIO';
  text?: string | null;
  mediaUrl?: string | null;
  mimeType?: string | null;
  createdAt: string;
  citizen?: { name: string } | null;
  user?: { name: string } | null;
};

export type SupportConversation = {
  id: string;
  status: 'NOVA' | 'EM_ATENDIMENTO' | 'FINALIZADA';
  updatedAt: string;
  citizen?: { id: string; name: string; phone?: string; cpf?: string; healthUnitPsfId?: string } | null;
  assignedTo?: { id: string; name: string } | null;
  messages: SupportMessage[];
};

function headers(token: string, json = false) {
  return { Authorization: `Bearer ${token}`, ...(json ? { 'Content-Type': 'application/json' } : {}) };
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(body?.message ?? 'Não foi possível concluir a operação.');
  }
  return response.json() as Promise<T>;
}

export function getCitizenSupportConversation(token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversation`, { headers: headers(token), cache: 'no-store' }).then(read<SupportConversation>);
}

export function listSupportConversations(token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversations`, { headers: headers(token), cache: 'no-store' }).then(read<SupportConversation[]>);
}

export function startSupportConversation(citizenId: string, token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversations`, {
    method: 'POST', headers: headers(token, true), body: JSON.stringify({ citizenId })
  }).then(read<SupportConversation>);
}

export function getSupportConversation(id: string, token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversations/${id}`, { headers: headers(token), cache: 'no-store' }).then(read<SupportConversation>);
}

export function sendSupportText(id: string, text: string, token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversations/${id}/messages`, {
    method: 'POST', headers: headers(token, true), body: JSON.stringify({ text })
  }).then(read<SupportMessage>);
}

export function sendSupportMedia(id: string, file: File, token: string) {
  const body = new FormData();
  body.append('file', file);
  return fetch(`${getPublicApiUrl()}/support-chat/conversations/${id}/media`, {
    method: 'POST', headers: headers(token), body
  }).then(read<SupportMessage>);
}

export function setSupportStatus(id: string, status: SupportConversation['status'], token: string) {
  return fetch(`${getPublicApiUrl()}/support-chat/conversations/${id}/status`, {
    method: 'PATCH', headers: headers(token, true), body: JSON.stringify({ status })
  }).then(read<SupportConversation>);
}

export function supportMediaUrl(path?: string | null) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${getPublicApiUrl()}${path}`;
}

export function connectSupportSocket(token: string): Socket {
  return io(`${getPublicApiUrl()}/support-chat`, { auth: { token }, transports: ['websocket', 'polling'] });
}
