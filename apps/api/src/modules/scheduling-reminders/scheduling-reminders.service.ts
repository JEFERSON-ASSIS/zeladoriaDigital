import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeSchedulingReminderDto } from './dto/subscribe.dto';

type PsfConfig = {
  id: string;
  label: string;
  baseUrl: string;
  empresaId: number;
};

type RemoteAppointment = {
  id: number;
  nome?: string;
  servico?: string;
  data?: string;
  hora?: string;
  status?: string;
};

@Injectable()
export class SchedulingRemindersService {
  private readonly logger = new Logger(SchedulingRemindersService.name);
  private vapidConfigured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.configureWebPush();
  }

  private configureWebPush() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@zeladoria.local';

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys ausentes — push de agendamento desativado.');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidConfigured = true;
  }

  async subscribe(dto: SubscribeSchedulingReminderDto) {
    return this.prisma.schedulingPushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        cpf: dto.cpf,
        psfId: dto.psfId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth
      },
      update: {
        cpf: dto.cpf,
        psfId: dto.psfId,
        p256dh: dto.p256dh,
        auth: dto.auth
      }
    });
  }

  @Cron('0 8 * * *', { timeZone: 'America/Cuiaba' })
  async sendDailyAppointmentReminders() {
    if (!this.vapidConfigured) {
      return { sent: 0, skipped: 'missing-vapid' };
    }

    const subscriptions = await this.prisma.schedulingPushSubscription.findMany();
    let sent = 0;

    for (const subscription of subscriptions) {
      const psf = this.getPsfConfig(subscription.psfId);
      if (!psf) continue;

      try {
        const appointments = await this.fetchAppointments(psf, subscription.cpf);
        const due = appointments.filter((item) => this.isDueTomorrow(item));

        for (const appointment of due) {
          const reminderKey = this.buildReminderKey(appointment.id);
          const remindedAt = (subscription.remindedAt as Record<string, string> | null) ?? {};
          if (remindedAt[reminderKey]) continue;

          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth }
            },
            JSON.stringify({
              title: 'Consulta amanhã',
              body: `${appointment.servico ?? 'Consulta'} · ${appointment.data ?? '—'}${
                appointment.hora ? ` às ${appointment.hora}` : ''
              } · ${psf.label}`,
              url: '/meus-agendamentos'
            })
          );

          remindedAt[reminderKey] = new Date().toISOString();
          await this.prisma.schedulingPushSubscription.update({
            where: { id: subscription.id },
            data: { remindedAt }
          });

          sent += 1;
        }
      } catch (error) {
        this.logger.warn(`Falha ao enviar lembrete (${subscription.id}): ${String(error)}`);
      }
    }

    this.logger.log(`Lembretes de agendamento enviados: ${sent}`);
    return { sent };
  }

  private getPsfConfig(psfId: string): PsfConfig | null {
    const map: Record<string, { env: string; label: string; empresaId: number; fallback: string }> = {
      psf1: {
        env: 'NEXT_PUBLIC_PSF1_API_URL',
        label: 'PSF 1',
        empresaId: 1,
        fallback: 'https://saude.agendaclique.com.br/api_chatbot_psf1'
      },
      psf2: {
        env: 'NEXT_PUBLIC_PSF2_API_URL',
        label: 'PSF 2',
        empresaId: 2,
        fallback: 'https://saude.agendaclique.com.br/api_chatbot_psf2'
      },
      psf3: {
        env: 'NEXT_PUBLIC_PSF3_API_URL',
        label: 'PSF 3',
        empresaId: 3,
        fallback: 'https://saude.agendaclique.com.br/api_chatbot_psf3'
      }
    };

    const item = map[psfId];
    if (!item) return null;

    return {
      id: psfId,
      label: item.label,
      baseUrl: this.config.get<string>(item.env) ?? item.fallback,
      empresaId: item.empresaId
    };
  }

  private async fetchAppointments(psf: PsfConfig, cpf: string): Promise<RemoteAppointment[]> {
    const params = new URLSearchParams({
      cpf,
      empresa: String(psf.empresaId),
      limite: '50'
    });

    const apiKey = this.config.get<string>('NEXT_PUBLIC_PSF_API_KEY') ?? '';
    if (apiKey) params.set('api_key', apiKey);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) headers['X-Api-Key'] = apiKey;

    const pwaUrl = `${psf.baseUrl.replace(/\/$/, '')}/endpoints/agendamentos/listar_pwa.php?${params}`;
    let response = await fetch(pwaUrl, { headers });

    if (response.status === 404) {
      const legacyUrl = `${psf.baseUrl.replace(/\/$/, '')}/endpoints/agendamentos/listar.php?${params}`;
      response = await fetch(legacyUrl, { headers });
    }

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data?: { agendamentos?: RemoteAppointment[] };
      agendamentos?: RemoteAppointment[];
    };

    return payload.data?.agendamentos ?? payload.agendamentos ?? [];
  }

  private normalizeStatus(status?: string) {
    return (status ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  private isPendingStatus(status?: string) {
    return this.normalizeStatus(status) === 'ausente';
  }

  private parseAppointmentDate(data?: string, hora?: string) {
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

  private isDueTomorrow(appointment: RemoteAppointment) {
    if (!this.isPendingStatus(appointment.status)) return false;
    const when = this.parseAppointmentDate(appointment.data, appointment.hora);
    if (!when) return false;

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const target = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    return target.getTime() === tomorrow.getTime();
  }

  private buildReminderKey(appointmentId: number) {
    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return `${appointmentId}:${day}`;
  }
}
