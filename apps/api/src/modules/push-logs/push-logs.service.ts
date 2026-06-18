import { Injectable } from '@nestjs/common';
import { PushNotificationSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type PushDeliveryResult = {
  citizenId?: string | null;
  phone?: string | null;
  cpf?: string | null;
  ok: boolean;
  error?: string;
};

@Injectable()
export class PushLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(limit = 50) {
    return this.prisma.pushNotificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: limit,
      include: {
        recipients: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });
  }

  findById(id: string) {
    return this.prisma.pushNotificationLog.findUnique({
      where: { id },
      include: {
        recipients: {
          orderBy: { sentAt: 'asc' }
        }
      }
    });
  }

  async recordBatch(params: {
    source: PushNotificationSource;
    title: string;
    body: string;
    url?: string;
    announcementId?: string;
    createdById?: string;
    results: PushDeliveryResult[];
  }) {
    const successCount = params.results.filter((item) => item.ok).length;

    return this.prisma.pushNotificationLog.create({
      data: {
        source: params.source,
        title: params.title.trim(),
        body: params.body.trim(),
        url: params.url?.trim() || null,
        announcementId: params.announcementId ?? null,
        createdById: params.createdById ?? null,
        targetCount: params.results.length,
        successCount,
        failureCount: params.results.length - successCount,
        recipients: {
          create: params.results.map((item) => ({
            citizenId: item.citizenId ?? null,
            phone: item.phone ?? null,
            cpf: item.cpf ?? null,
            status: item.ok ? 'sent' : 'failed',
            error: item.error ?? null
          }))
        }
      },
      include: {
        recipients: true
      }
    });
  }
}
