'use client';

import {
  createBooking,
  fetchAvailableDays,
  fetchAvailableTimes,
  fetchAvailableTurnos,
  type AvailableDay,
  type AvailableTurno,
  type MedicoTurno
} from '@/lib/scheduling/scheduling-api';
import {
  getMedicoBookingFlow,
  getPsfById,
  type PsfConfig,
  type PsfId,
  type ServiceKind
} from '@/lib/scheduling/psf-config';

export type ChatServiceOption = {
  kind: ServiceKind;
  label: string;
  servicoId: number;
};

export type ChatBookingPayload = {
  nome: string;
  telefone: string;
  cpf: string;
  service: ChatServiceOption;
  day: AvailableDay;
  hora?: string;
  turno?: MedicoTurno;
};

export type ChatBookingResult = {
  success: boolean;
  protocolo?: string;
  error?: string;
};

export function serviceNeedsTime(psf: PsfConfig, serviceKind: ServiceKind) {
  if (serviceKind === 'dentista') return true;
  if (serviceKind !== 'medico') return false;
  return getMedicoBookingFlow(psf) !== 'turno';
}

export function serviceNeedsTurno(psf: PsfConfig, serviceKind: ServiceKind) {
  return serviceKind === 'medico' && getMedicoBookingFlow(psf) === 'turno';
}

export function useAgendamentoFlow(psfId: PsfId) {
  const psf = getPsfById(psfId);

  const diasDisponiveis = async (service: ChatServiceOption): Promise<AvailableDay[]> => {
    if (!psf) return [];
    return fetchAvailableDays(psf, service.kind, service.servicoId);
  };

  const horariosDisponiveis = async (service: ChatServiceOption, day: AvailableDay): Promise<string[]> => {
    if (!psf || !serviceNeedsTime(psf, service.kind)) return [];
    return fetchAvailableTimes(psf, service.kind, service.servicoId, day.date);
  };

  const turnosDisponiveis = async (
    service: ChatServiceOption,
    day: AvailableDay
  ): Promise<{ turnos: AvailableTurno[]; suggested: MedicoTurno | null }> => {
    if (!psf || !serviceNeedsTurno(psf, service.kind)) {
      return { turnos: [], suggested: null };
    }
    return fetchAvailableTurnos(psf, service.servicoId, day.date);
  };

  const criarAgendamento = async (payload: ChatBookingPayload): Promise<ChatBookingResult> => {
    if (!psf) return { success: false, error: 'Unidade não encontrada.' };

    try {
      const result = await createBooking(psf, {
        nome: payload.nome,
        telefone: payload.telefone,
        cpf: payload.cpf,
        servicoId: payload.service.servicoId,
        serviceKind: payload.service.kind,
        data: payload.day.date,
        hora: payload.hora,
        turno: payload.turno
      });

      return { success: true, protocolo: result.id ? String(result.id) : undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar agendamento.'
      };
    }
  };

  return { diasDisponiveis, horariosDisponiveis, turnosDisponiveis, criarAgendamento };
}
