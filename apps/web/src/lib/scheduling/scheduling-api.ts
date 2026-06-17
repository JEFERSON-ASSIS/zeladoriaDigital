import type { PsfConfig, ServiceKind } from './psf-config';
import { onlyDigits } from './psf-storage';

const API_KEY = process.env.NEXT_PUBLIC_PSF_API_KEY ?? '';

type ApiEnvelope<T> = {
  statusCode?: number;
  data?: T;
  meta?: Record<string, unknown>;
};

export type AvailableDay = {
  label: string;
  date: string;
  vagas?: number;
};

export type SchedulingAppointment = {
  id: number;
  nome?: string;
  servico?: string;
  data?: string;
  hora?: string;
  status?: string;
};

export class SchedulingApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

function buildUrl(baseUrl: string, path: string, params?: Record<string, string | number | undefined>) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
  }
  if (API_KEY) url.searchParams.set('api_key', API_KEY);
  return url.toString();
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function unwrapData<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw new SchedulingApiError('Resposta inválida da API de agendamento.');
  }
  const body = payload as ApiEnvelope<T> & { message?: string; code?: string; sucesso?: boolean };
  if ('statusCode' in body && body.statusCode && body.statusCode >= 400) {
    const err = body.data as { message?: string; code?: string } | undefined;
    throw new SchedulingApiError(err?.message ?? body.message ?? 'Erro na API de agendamento.', err?.code ?? body.code);
  }
  if ('data' in body && body.data !== undefined) return body.data as T;
  return payload as T;
}

const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new SchedulingApiError('A API de agendamento demorou para responder. Tente novamente.');
    }
    throw cause;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function schedulingRequest<T>(
  psf: PsfConfig,
  path: string,
  init?: RequestInit,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
  };

  let response: Response;
  try {
    response = await fetchWithTimeout(buildUrl(psf.baseUrl, path, params), {
      ...init,
      mode: 'cors',
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined)
      }
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : '';
    throw new SchedulingApiError(
      `Não foi possível conectar à API de agendamento (${psf.baseUrl}).${detail ? ` ${detail}` : ''}`
    );
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const err = payload as { data?: { message?: string; code?: string }; message?: string; code?: string } | null;
    throw new SchedulingApiError(
      err?.data?.message ?? err?.message ?? `Erro ${response.status} na API de agendamento.`,
      err?.data?.code ?? err?.code
    );
  }

  return unwrapData<T>(payload);
}

export function extractDateFromDayLabel(label: string) {
  const match = label.match(/(\d{2}\/\d{2}\/\d{4})/);
  return match?.[1] ?? label.split(' ')[0] ?? label;
}

export async function fetchAvailableDays(psf: PsfConfig, serviceKind: ServiceKind, servicoId: number) {
  const path =
    serviceKind === 'medico'
      ? '/endpoints/disponibilidade/dias_medico.php'
      : '/endpoints/disponibilidade/dias.php';

  const params: Record<string, string | number> = { empresa: psf.empresaId };
  if (serviceKind !== 'medico') params.servico = servicoId;

  const data = await schedulingRequest<{
    dias?: string[];
    vagas?: number[];
  }>(psf, path, { method: 'GET' }, params);

  const dias = data.dias ?? [];
  return dias.map((label, index) => ({
    label,
    date: extractDateFromDayLabel(label),
    vagas: data.vagas?.[index]
  })) satisfies AvailableDay[];
}

export async function fetchAvailableTimes(psf: PsfConfig, serviceKind: ServiceKind, servicoId: number, date: string) {
  const path =
    serviceKind === 'medico'
      ? '/endpoints/disponibilidade/horarios_medico.php'
      : '/endpoints/disponibilidade/horarios.php';

  const params: Record<string, string | number> = {
    empresa: psf.empresaId,
    data: date
  };
  if (serviceKind !== 'medico') params.servico = servicoId;

  const data = await schedulingRequest<{ horarios?: string[] }>(psf, path, { method: 'GET' }, params);
  return data.horarios ?? [];
}

export type CreateBookingInput = {
  nome: string;
  telefone: string;
  cpf: string;
  servicoId: number;
  serviceKind: ServiceKind;
  data: string;
  hora?: string;
};

export async function createBooking(psf: PsfConfig, input: CreateBookingInput) {
  const body: Record<string, unknown> = {
    nome: input.nome.trim(),
    telefone: onlyDigits(input.telefone),
    cpf: onlyDigits(input.cpf),
    servico: input.servicoId,
    empresa: psf.empresaId,
    data: input.data,
    setor: ''
  };

  let path = '/endpoints/agendamentos/criar.php';

  if (input.serviceKind === 'medico') {
    if (!input.hora) throw new SchedulingApiError('Selecione um horário para a consulta médica.');
    path = '/endpoints/agendamentos/criar_medico_hora.php';
    body.hora = input.hora;
    delete body.servico;
  } else if (input.serviceKind === 'dentista') {
    if (!input.hora) throw new SchedulingApiError('Selecione um horário para a consulta dentista.');
    body.hora = input.hora;
  }

  const url = buildUrl(psf.baseUrl, path);
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
      },
      body: JSON.stringify(body)
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : '';
    throw new SchedulingApiError(
      `Não foi possível conectar à API de agendamento (${psf.baseUrl}).${detail ? ` ${detail}` : ''}`
    );
  }

  const result = (await parseJson(response)) as {
    sucesso?: boolean;
    id?: number;
    message?: string;
    mensagem?: string;
    data?: { message?: string; code?: string };
  } | null;

  if (!response.ok) {
    throw new SchedulingApiError(
      result?.data?.message ?? result?.message ?? result?.mensagem ?? `Erro ${response.status} ao agendar.`,
      result?.data?.code
    );
  }

  if (result?.sucesso === false) {
    throw new SchedulingApiError(result.message ?? result.mensagem ?? 'Não foi possível criar o agendamento.');
  }

  return result ?? {};
}

export async function listAppointmentsByCpf(psf: PsfConfig, cpf: string) {
  const url = buildUrl(psf.baseUrl, '/endpoints/agendamentos/listar.php', {
    cpf: onlyDigits(cpf),
    empresa: psf.empresaId
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
      }
    });
  } catch (cause) {
    throw cause instanceof SchedulingApiError
      ? cause
      : new SchedulingApiError('Não foi possível conectar à API de agendamento.');
  }

  const payload = await parseJson(response);

  if (response.status === 404) {
    return { total: 0, agendamentos: [] as SchedulingAppointment[], message: 'Nenhum agendamento encontrado.' };
  }

  if (!response.ok) {
    const err = payload as { data?: { message?: string }; message?: string } | null;
    throw new SchedulingApiError(err?.data?.message ?? err?.message ?? 'Erro ao consultar agendamentos.');
  }

  const data = unwrapData<{
    status?: string;
    message?: string;
    total?: number;
    agendamentos?: SchedulingAppointment[];
  }>(payload);

  return {
    total: data.total ?? data.agendamentos?.length ?? 0,
    agendamentos: data.agendamentos ?? [],
    message: data.message
  };
}

export async function listAllAppointmentsForPwa(psf: PsfConfig, cpf: string, limit = 50) {
  const url = buildUrl(psf.baseUrl, '/endpoints/agendamentos/listar_pwa.php', {
    cpf: onlyDigits(cpf),
    empresa: psf.empresaId,
    limite: limit
  });

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
      }
    });
  } catch (cause) {
    throw cause instanceof SchedulingApiError
      ? cause
      : new SchedulingApiError('Não foi possível conectar à API de agendamento.');
  }

  if (response.status === 404) {
    const fallback = await listAppointmentsByCpf(psf, cpf);
    return {
      total: fallback.total,
      agendamentos: fallback.agendamentos,
      partialSync: true as const
    };
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const err = payload as { data?: { message?: string }; message?: string } | null;
    throw new SchedulingApiError(err?.data?.message ?? err?.message ?? 'Erro ao consultar agendamentos.');
  }

  const data = unwrapData<{
    total?: number;
    agendamentos?: SchedulingAppointment[];
  }>(payload);

  return {
    total: data.total ?? data.agendamentos?.length ?? 0,
    agendamentos: data.agendamentos ?? [],
    partialSync: false as const
  };
}

export async function cancelAppointment(psf: PsfConfig, appointmentId: number) {
  const url = buildUrl(psf.baseUrl, '/endpoints/agendamentos/cancelar.php', {
    id: appointmentId,
    empresa: psf.empresaId
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {})
      }
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : '';
    throw new SchedulingApiError(
      `Não foi possível conectar à API de agendamento (${psf.baseUrl}).${detail ? ` ${detail}` : ''}`
    );
  }

  const payload = await parseJson(response);

  if (response.status === 404) {
    throw new SchedulingApiError('Agendamento não encontrado na unidade de saúde.');
  }

  if (!response.ok) {
    const err = payload as { data?: { message?: string; code?: string }; message?: string } | null;
    throw new SchedulingApiError(
      err?.data?.message ?? err?.message ?? `Erro ${response.status} ao cancelar.`,
      err?.data?.code
    );
  }

  const data = unwrapData<{ status?: string; message?: string; id?: number }>(payload);
  return {
    status: data.status ?? 'deleted',
    message: data.message ?? 'Cancelado com sucesso.',
    id: data.id ?? appointmentId
  };
}
