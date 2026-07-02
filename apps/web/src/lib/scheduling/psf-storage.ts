import type { PsfId } from './psf-config';
import { getPsfById } from './psf-config';
import { getSession } from '../auth';

const PATIENT_PROFILE_KEY = 'zeladoria.psf.patient';

export type PatientProfile = {
  nome: string;
  telefone: string;
  cpf: string;
};

export function getSavedPsfId(): PsfId | null {
  const fromSession = getSession()?.user?.healthUnitPsfId;
  if (fromSession === 'psf1' || fromSession === 'psf2' || fromSession === 'psf3') {
    return fromSession;
  }
  return null;
}

export function getSavedPsfConfig() {
  const id = getSavedPsfId();
  return id ? getPsfById(id) : null;
}

export function savePsfChoice(_id: PsfId) {
  // Unidade de saúde fica no cadastro do cidadão (banco), não no localStorage.
}

export function clearPsfChoice() {
  // No-op: apenas admin altera a unidade no painel.
}

export function getPatientProfile(): PatientProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PATIENT_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PatientProfile;
  } catch {
    return null;
  }
}

export function savePatientProfile(profile: PatientProfile) {
  window.localStorage.setItem(PATIENT_PROFILE_KEY, JSON.stringify(profile));
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
