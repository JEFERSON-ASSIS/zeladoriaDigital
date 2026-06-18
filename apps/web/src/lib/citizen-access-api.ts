const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

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

export async function citizenAccess(phone: string, cpf: string, lgpdAccepted: boolean) {
  const response = await fetch(`${API_URL}/auth/citizen/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: onlyDigits(phone),
      cpf: onlyDigits(cpf),
      lgpdAccepted
    })
  });

  if (!response.ok) {
    let message = 'Não foi possível entrar. Verifique celular e CPF.';
    try {
      const payload = (await response.json()) as { message?: string | string[] };
      if (typeof payload.message === 'string') message = payload.message;
      else if (Array.isArray(payload.message)) message = payload.message.join(', ');
    } catch {
      // Mantém mensagem padrão.
    }
    throw new Error(message);
  }

  return response.json() as Promise<{
    access_token: string;
    user: { id: string; name: string; email?: string; role: 'CIDADAO' };
  }>;
}
