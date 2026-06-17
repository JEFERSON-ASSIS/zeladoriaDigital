import type { PsfId } from './psf-config';
import type { SchedulingAppointment } from './scheduling-api';

const HISTORY_KEY = 'zeladoria.psf.history';

export type SchedulingHistoryStatus = 'agendado' | 'cancelado';

export type SchedulingHistoryEntry = {
  localId: string;
  appointmentId: number;
  psfId: PsfId;
  psfLabel: string;
  nome: string;
  cpf: string;
  telefone?: string;
  servico: string;
  data: string;
  hora?: string;
  status: SchedulingHistoryStatus;
  remoteStatus?: string;
  bookedAt: string;
  cancelledAt?: string;
  syncedAt?: string;
};

function readHistory(): SchedulingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SchedulingHistoryEntry[];
  } catch {
    return [];
  }
}

function writeHistory(entries: SchedulingHistoryEntry[]) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStatus(status: string) {
  return status
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function isCancelledRemoteStatus(status?: string) {
  if (!status) return false;
  return normalizeStatus(status).includes('cancelado');
}

export function isCancellableRemoteStatus(status?: string) {
  return normalizeStatus(status ?? '') === 'ausente';
}

export function formatRemoteStatus(status?: string) {
  if (!status) return '—';
  const normalized = normalizeStatus(status);
  if (normalized === 'ausente') return 'Aguardando consulta';
  if (normalized.includes('cancelado')) return 'Cancelado';
  if (normalized.includes('compareceu')) return 'Compareceu';
  if (normalized.includes('bloqueado')) return 'Bloqueado';
  if (normalized === 'removido') return 'Removido do sistema';
  return status;
}

export function recordBookingHistory(entry: Omit<SchedulingHistoryEntry, 'localId' | 'status' | 'bookedAt'>) {
  const history = readHistory();
  const existing = history.find(
    (item) => item.appointmentId === entry.appointmentId && item.status === 'agendado'
  );
  if (existing) return existing;

  const record: SchedulingHistoryEntry = {
    ...entry,
    localId: createLocalId(),
    status: 'agendado',
    remoteStatus: entry.remoteStatus ?? 'Ausente',
    bookedAt: new Date().toISOString()
  };

  writeHistory([record, ...history]);
  return record;
}

export function recordCancellationHistory(
  appointmentId: number,
  patch?: Partial<Pick<SchedulingHistoryEntry, 'nome' | 'cpf' | 'servico' | 'data' | 'hora' | 'psfId' | 'psfLabel' | 'telefone'>>
) {
  const history = readHistory();
  const now = new Date().toISOString();
  const index = history.findIndex(
    (item) => item.appointmentId === appointmentId && item.status === 'agendado'
  );

  if (index >= 0) {
    history[index] = {
      ...history[index],
      ...patch,
      status: 'cancelado',
      remoteStatus: 'Cancelado usuário',
      cancelledAt: now,
      syncedAt: now
    };
    writeHistory(history);
    return history[index];
  }

  const record: SchedulingHistoryEntry = {
    localId: createLocalId(),
    appointmentId,
    psfId: patch?.psfId ?? 'psf1',
    psfLabel: patch?.psfLabel ?? 'PSF',
    nome: patch?.nome ?? '—',
    cpf: patch?.cpf ?? '',
    telefone: patch?.telefone,
    servico: patch?.servico ?? 'Consulta',
    data: patch?.data ?? '—',
    hora: patch?.hora,
    status: 'cancelado',
    remoteStatus: 'Cancelado usuário',
    bookedAt: now,
    cancelledAt: now,
    syncedAt: now
  };

  writeHistory([record, ...history]);
  return record;
}

export function syncHistoryWithRemote(
  cpf: string,
  remote: SchedulingAppointment[],
  psfId: PsfId,
  psfLabel: string
) {
  const digits = cpf.replace(/\D/g, '');
  if (!digits) return readHistory();

  const history = readHistory();
  const now = new Date().toISOString();
  const remoteById = new Map(remote.map((item) => [item.id, item]));

  const updated = history.map((entry) => {
    if (entry.cpf.replace(/\D/g, '') !== digits || entry.psfId !== psfId) {
      return entry;
    }

    const remoteItem = remoteById.get(entry.appointmentId);
    if (remoteItem) {
      const patch: Partial<SchedulingHistoryEntry> = {
        remoteStatus: remoteItem.status,
        syncedAt: now,
        data: remoteItem.data ?? entry.data,
        hora: remoteItem.hora ?? entry.hora,
        servico: remoteItem.servico ?? entry.servico,
        nome: remoteItem.nome ?? entry.nome
      };

      if (isCancelledRemoteStatus(remoteItem.status)) {
        patch.status = 'cancelado';
        if (!entry.cancelledAt) patch.cancelledAt = now;
      } else if (entry.status === 'cancelado' && isCancellableRemoteStatus(remoteItem.status)) {
        patch.status = 'agendado';
        patch.cancelledAt = undefined;
      } else if (!isCancelledRemoteStatus(remoteItem.status) && entry.status !== 'cancelado') {
        patch.status = 'agendado';
      }

      return { ...entry, ...patch };
    }

    if (entry.status === 'agendado') {
      return {
        ...entry,
        status: 'cancelado' as const,
        remoteStatus: 'Removido',
        syncedAt: now,
        cancelledAt: entry.cancelledAt ?? now
      };
    }

    return { ...entry, syncedAt: now };
  });

  const knownIds = new Set(
    updated
      .filter((entry) => entry.cpf.replace(/\D/g, '') === digits && entry.psfId === psfId)
      .map((entry) => entry.appointmentId)
  );

  const imported: SchedulingHistoryEntry[] = [];
  for (const remoteItem of remote) {
    if (knownIds.has(remoteItem.id)) continue;
    imported.push({
      localId: createLocalId(),
      appointmentId: remoteItem.id,
      psfId,
      psfLabel,
      nome: remoteItem.nome ?? '—',
      cpf: digits,
      servico: remoteItem.servico ?? 'Consulta',
      data: remoteItem.data ?? '—',
      hora: remoteItem.hora,
      status: isCancelledRemoteStatus(remoteItem.status) ? 'cancelado' : 'agendado',
      remoteStatus: remoteItem.status,
      bookedAt: now,
      syncedAt: now,
      cancelledAt: isCancelledRemoteStatus(remoteItem.status) ? now : undefined
    });
  }

  writeHistory([...imported, ...updated]);
  return getSchedulingHistory(digits);
}

export function getSchedulingHistory(cpf?: string) {
  const digits = cpf?.replace(/\D/g, '') ?? '';
  const history = readHistory();
  if (!digits) return history;
  return history.filter((item) => item.cpf.replace(/\D/g, '') === digits);
}

export function formatHistoryTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function getHistoryDisplayStatus(entry: SchedulingHistoryEntry) {
  if (entry.remoteStatus) return formatRemoteStatus(entry.remoteStatus);
  return entry.status === 'agendado' ? 'Agendado' : 'Cancelado';
}
