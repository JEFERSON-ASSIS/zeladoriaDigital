const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const LAST_PHONE_KEY = 'zeladoria.citizen.lastPhone';

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

export function getLastCitizenPhone() {
  if (typeof window === 'undefined') return '';
  const raw = window.localStorage.getItem(LAST_PHONE_KEY);
  return raw ? formatPhone(raw) : '';
}

export function saveLastCitizenPhone(phone: string) {
  window.localStorage.setItem(LAST_PHONE_KEY, onlyDigits(phone));
}

export async function lookupCitizenPhone(phone: string) {
  const response = await fetch(`${API_URL}/auth/citizen/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: onlyDigits(phone) })
  });

  if (!response.ok) {
    throw new Error('Não foi possível verificar o celular.');
  }

  return response.json() as Promise<{ registered: boolean }>;
}

export async function citizenAccess(phone: string, cpf?: string, lgpdAccepted = false) {
  const payload: { phone: string; cpf?: string; lgpdAccepted?: boolean } = {
    phone: onlyDigits(phone)
  };

  if (cpf) {
    payload.cpf = onlyDigits(cpf);
    payload.lgpdAccepted = lgpdAccepted;
  }

  const response = await fetch(`${API_URL}/auth/citizen/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = cpf
      ? 'Não foi possível entrar. Verifique celular e CPF.'
      : 'Celular não encontrado. Complete seu cadastro.';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch {
      // Mantém mensagem padrão.
    }
    throw new Error(message);
  }

  saveLastCitizenPhone(phone);

  return response.json() as Promise<{
    access_token: string;
    user: { id: string; name: string; email?: string; role: 'CIDADAO' };
  }>;
}
