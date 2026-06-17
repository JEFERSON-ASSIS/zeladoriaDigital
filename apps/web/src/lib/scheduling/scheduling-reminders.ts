const REMINDER_LOG_KEY = 'zeladoria.psf.reminder-log';

export function isPendingAppointmentStatus(status?: string) {
  if (!status) return false;
  return status
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '') === 'ausente';
}

export function parseAppointmentDateTime(data?: string, hora?: string) {
  if (!data) return null;
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const [hours = 0, minutes = 0] = (hora ?? '00:00').split(':').map(Number);

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isAppointmentTomorrow(date: Date) {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);

  const target = startOfDay(date);
  return target.getTime() === tomorrow.getTime();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function readReminderLog(): Record<string, true> {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(REMINDER_LOG_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, true>;
  } catch {
    return {};
  }
}

function writeReminderLog(log: Record<string, true>) {
  window.localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(log));
}

export function buildReminderKey(appointmentId: number) {
  return `${appointmentId}:${todayKey()}`;
}

export function wasReminderShown(appointmentId: number) {
  return Boolean(readReminderLog()[buildReminderKey(appointmentId)]);
}

export function markReminderShown(appointmentId: number) {
  const log = readReminderLog();
  log[buildReminderKey(appointmentId)] = true;
  writeReminderLog(log);
}

export type ReminderAppointment = {
  id: number;
  nome?: string;
  servico?: string;
  data?: string;
  hora?: string;
  status?: string;
};

export function findTomorrowPendingAppointments(appointments: ReminderAppointment[]) {
  return appointments.filter((item) => {
    if (!isPendingAppointmentStatus(item.status)) return false;
    const when = parseAppointmentDateTime(item.data, item.hora);
    return when ? isAppointmentTomorrow(when) : false;
  });
}

export async function showAppointmentReminder(
  appointment: ReminderAppointment,
  psfLabel: string
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  if (wasReminderShown(appointment.id)) return false;

  const title = 'Consulta amanhã';
  const body = `${appointment.servico ?? 'Consulta'} · ${appointment.data ?? '—'}${
    appointment.hora ? ` às ${appointment.hora}` : ''
  } · ${psfLabel}`;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        tag: `appointment-${appointment.id}`,
        data: { url: '/meus-agendamentos' }
      });
    } else {
      new Notification(title, { body });
    }

    markReminderShown(appointment.id);
    return true;
  } catch {
    return false;
  }
}

export async function processAppointmentReminders(
  appointments: ReminderAppointment[],
  psfLabel: string
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return 0;
  if (Notification.permission !== 'granted') return 0;

  const due = findTomorrowPendingAppointments(appointments);
  let sent = 0;

  for (const appointment of due) {
    const ok = await showAppointmentReminder(appointment, psfLabel);
    if (ok) sent += 1;
  }

  return sent;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
