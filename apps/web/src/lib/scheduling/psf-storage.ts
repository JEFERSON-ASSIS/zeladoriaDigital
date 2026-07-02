import { isPsfId } from '../psf-unit';
import type { PsfId } from './psf-config';
import { getPsfById } from './psf-config';
import { getSession } from '../auth';

export type PatientProfile = {
  nome: string;
  telefone: string;
  cpf: string;
};

export function getSavedPsfId(): PsfId | null {
  const fromSession = getSession()?.user?.healthUnitPsfId;
  if (fromSession && isPsfId(fromSession)) {
    return fromSession;
  }
  return null;
}

export function getSavedPsfConfig() {
  const id = getSavedPsfId();
  return id ? getPsfById(id) : null;
}

export function savePsfChoice(_id: PsfId) {
  // Unidade de saúde fica no cadastro do cidadão (banco).
}

export function clearPsfChoice() {
  // No-op: apenas admin altera a unidade no painel.
}

export function getPatientProfile(): PatientProfile | null {
  const session = getSession();
  if (!session || session.user.role !== 'CIDADAO') return null;

  const phone = session.user.phone ?? '';
  const cpf = session.user.cpf ?? '';
  if (!phone && !cpf) return null;

  return {
    nome: session.user.name || 'Cidadão',
    telefone: phone ? formatPhone(phone) : '',
    cpf: cpf ? formatCpf(cpf) : ''
  };
}

export function savePatientProfile(_profile: PatientProfile) {
  // Dados do paciente vêm da sessão/API, não do localStorage.
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
