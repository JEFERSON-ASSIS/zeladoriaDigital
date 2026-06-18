import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebPushService } from '../web-push/web-push.service';
import {
  CreateAnnouncementDto,
  PublishAnnouncementDto,
  SubscribeCitizenPushDto,
  UpdateAnnouncementDto
} from './dto/announcement.dto';

export type AnnouncementPushResult = {
  sent: number;
  skipped?: 'missing-vapid';
};

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webPush: WebPushService
  ) {}

  findFeed() {
    return this.prisma.citizenAnnouncement.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }]
    });
  }

  findAllAdmin() {
    return this.prisma.citizenAnnouncement.findMany({
      orderBy: [{ createdAt: 'desc' }]
    });
  }

  async create(dto: CreateAnnouncementDto, createdById?: string) {
    const announcement = await this.prisma.citizenAnnouncement.create({
      data: {
        title: dto.title.trim(),
        summary: dto.summary.trim(),
        body: dto.body?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
        published: Boolean(dto.published),
        publishedAt: dto.published ? new Date() : null,
        createdById: createdById ?? null
      }
    });

    let push: AnnouncementPushResult | null = null;

    if (dto.published && dto.sendPush) {
      push = await this.sendPushForAnnouncement(announcement.id, announcement.title, announcement.summary).catch(
        (error) => {
          this.logger.warn(`Aviso ${announcement.id} salvo, mas o push falhou.`, error);
          return { sent: 0 } satisfies AnnouncementPushResult;
        }
      );
    }

    return { ...announcement, push };
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const current = await this.prisma.citizenAnnouncement.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Aviso não encontrado.');

    const published = dto.published ?? current.published;

    return this.prisma.citizenAnnouncement.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        summary: dto.summary?.trim(),
        body: dto.body === undefined ? undefined : dto.body?.trim() || null,
        imageUrl: dto.imageUrl === undefined ? undefined : dto.imageUrl?.trim() || null,
        linkUrl: dto.linkUrl === undefined ? undefined : dto.linkUrl?.trim() || null,
        published,
        publishedAt: published && !current.publishedAt ? new Date() : current.publishedAt
      }
    });
  }

  async publish(id: string, dto: PublishAnnouncementDto) {
    const current = await this.prisma.citizenAnnouncement.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Aviso não encontrado.');

    const announcement = await this.prisma.citizenAnnouncement.update({
      where: { id },
      data: {
        published: true,
        publishedAt: current.publishedAt ?? new Date()
      }
    });

    let push: AnnouncementPushResult | null = null;

    if (dto.sendPush) {
      push = await this.sendPushForAnnouncement(announcement.id, announcement.title, announcement.summary).catch(
        (error) => {
          this.logger.warn(`Aviso ${announcement.id} publicado, mas o push falhou.`, error);
          return { sent: 0 } satisfies AnnouncementPushResult;
        }
      );
    }

    return { ...announcement, push };
  }

  async getPushStatus() {
    const subscriptions = await this.prisma.citizenPushSubscription.count();
    return {
      configured: this.webPush.isConfigured(),
      subscriptions
    };
  }

  async remove(id: string) {
    await this.prisma.citizenAnnouncement.delete({ where: { id } });
    return { ok: true };
  }

  async subscribePush(citizenId: string, dto: SubscribeCitizenPushDto) {
    return this.prisma.citizenPushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        citizenId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth
      },
      update: {
        citizenId,
        p256dh: dto.p256dh,
        auth: dto.auth
      }
    });
  }

  buildImagePath(filename: string) {
    return `/uploads/announcements/${filename}`;
  }

  private async sendPushForAnnouncement(id: string, title: string, summary: string): Promise<AnnouncementPushResult> {
    if (!this.webPush.isConfigured()) {
      this.logger.warn('Push não configurado (VAPID ausente) — aviso salvo sem notificação.');
      return { sent: 0, skipped: 'missing-vapid' as const };
    }

    const subscriptions = await this.prisma.citizenPushSubscription.findMany();
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        const result = await this.webPush.send(
          {
            endpoint: subscription.endpoint,
            p256dh: subscription.p256dh,
            auth: subscription.auth
          },
          {
            title,
            body: summary,
            url: '/app/inicio'
          }
        );
        if (result.ok) sent += 1;
      } catch {
        await this.prisma.citizenPushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
      }
    }

    if (sent > 0) {
      await this.prisma.citizenAnnouncement.update({
        where: { id },
        data: { pushSentAt: new Date() }
      });
    }

    return { sent };
  }
}
