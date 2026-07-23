export type PsfId = 'psf1' | 'psf2' | 'psf3';

export type ServiceKind = 'medico' | 'enfermeiro' | 'dentista';

/** Fluxo de agendamento médico por unidade (conforme rotas publicadas em produção). */
export type MedicoBookingFlow =
  | 'hora' // dias_medico -> horarios_medico -> criar_medico_hora (PSF1/2)
  | 'hora_servico' // dias.php?servico -> horarios.php?servico -> criar.php+hora (PSF3)
  | 'turno'; // dias.php -> turnos.php -> criar.php+turno

export type PsfConfig = {
  id: PsfId;
  label: string;
  subtitle: string;
  baseUrl: string;
  empresaId: number;
  servicos: Record<ServiceKind, number>;
  /** PSF1 primeiro; demais usam mesma estrutura (ver openapi.yaml). */
  bookingEnabled: boolean;
  /** @deprecated use medicoFlow */
  medicoHoraFlow?: boolean;
  medicoFlow?: MedicoBookingFlow;
};

const PROD_PSF_BASE = 'https://saude.agendaclique.com.br/painel';

function normalizePsfBaseUrl(url: string) {
  return url.replace('https://saude.agendaclique.com.br/api_chatbot_', `${PROD_PSF_BASE}/api_chatbot_`);
}

/** URLs conforme `api_agendamentos/api_chatbot_shared/docs/openapi.yaml` */
export const PSF_OPTIONS: PsfConfig[] = [
  {
    id: 'psf1',
    label: 'PSF 1',
    subtitle: 'Sol Nascente',
    baseUrl: normalizePsfBaseUrl(process.env.NEXT_PUBLIC_PSF1_API_URL ?? `${PROD_PSF_BASE}/api_chatbot_psf1`),
    empresaId: 1,
    servicos: { medico: 18, enfermeiro: 20, dentista: 22 },
    bookingEnabled: true
  },
  {
    id: 'psf2',
    label: 'PSF 2',
    subtitle: 'PSF 2 - Centro',
    baseUrl: normalizePsfBaseUrl(process.env.NEXT_PUBLIC_PSF2_API_URL ?? `${PROD_PSF_BASE}/api_chatbot_psf2`),
    empresaId: 2,
    servicos: { medico: 21, enfermeiro: 23, dentista: 19 },
    bookingEnabled: true
  },
  {
    id: 'psf3',
    label: 'UBS Rural',
    subtitle: 'PSF 3 - Zona Rural',
    baseUrl: normalizePsfBaseUrl(process.env.NEXT_PUBLIC_PSF3_API_URL ?? `${PROD_PSF_BASE}/api_chatbot_psf3`),
    empresaId: 3,
    servicos: { medico: 24, enfermeiro: 25, dentista: 0 },
    bookingEnabled: true,
    medicoFlow: 'hora_servico'
  }
];

export function getPsfById(id: PsfId) {
  return PSF_OPTIONS.find((item) => item.id === id) ?? null;
}

export function getMedicoBookingFlow(psf: PsfConfig): MedicoBookingFlow {
  if (psf.medicoFlow) return psf.medicoFlow;
  if (psf.medicoHoraFlow === false) return 'turno';
  return 'hora';
}

/** @deprecated use getMedicoBookingFlow */
export function usesMedicoHoraFlow(psf: PsfConfig) {
  const flow = getMedicoBookingFlow(psf);
  return flow === 'hora' || flow === 'hora_servico';
}

export function usesMedicoTurnoFlow(psf: PsfConfig) {
  return getMedicoBookingFlow(psf) === 'turno';
}

export function getAvailableServices(psf: PsfConfig) {
  const items: { kind: ServiceKind; label: string; servicoId: number }[] = [];
  if (psf.servicos.medico > 0) {
    items.push({ kind: 'medico', label: 'Consulta médica', servicoId: psf.servicos.medico });
  }
  if (psf.servicos.enfermeiro > 0) {
    items.push({ kind: 'enfermeiro', label: 'Consulta enfermeira', servicoId: psf.servicos.enfermeiro });
  }
  if (psf.servicos.dentista > 0) {
    items.push({ kind: 'dentista', label: 'Consulta dentista', servicoId: psf.servicos.dentista });
  }
  return items;
}
