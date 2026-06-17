import type { PsfId } from './psf-config';
import { getPsfById } from './psf-config';

const PSF_UNIT_KEY = 'zeladoria.psf.unidade';
const PATIENT_PROFILE_KEY = 'zeladoria.psf.patient';

export type PatientProfile = {
  nome: string;
  telefone: string;
  cpf: string;
};

export function getSavedPsfId(): PsfId | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PSF_UNIT_KEY);
  if (raw === 'psf1' || raw === 'psf2' || raw === 'psf3') return raw;
  return null;
}

export function getSavedPsfConfig() {
  const id = getSavedPsfId();
  return id ? getPsfById(id) : null;
}

export function savePsfChoice(id: PsfId) {
  window.localStorage.setItem(PSF_UNIT_KEY, id);
}

export function clearPsfChoice() {
  window.localStorage.removeItem(PSF_UNIT_KEY);
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
