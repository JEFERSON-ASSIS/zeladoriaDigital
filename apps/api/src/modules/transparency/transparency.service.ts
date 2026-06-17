import { Injectable } from '@nestjs/common';
import { OccurrenceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransparencyService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(filters: { periodStart?: string; periodEnd?: string; categoryId?: string; neighborhoodId?: string; status?: string; priority?: string } = {}) {
    const where: Prisma.OccurrenceWhereInput = {};

    if (filters.periodStart || filters.periodEnd) {
      where.createdAt = {};
      if (filters.periodStart) where.createdAt.gte = new Date(filters.periodStart);
      if (filters.periodEnd) {
        const end = new Date(filters.periodEnd);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.neighborhoodId) where.neighborhoodId = filters.neighborhoodId;
    if (filters.status) where.status = filters.status as OccurrenceStatus;
    if (filters.priority) where.priority = filters.priority as never;

    const occurrences = await this.prisma.occurrence.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        neighborhood: { select: { name: true } },
        serviceOrders: { select: { finishedAt: true, startedAt: true, slaHours: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = occurrences.length;
    const completed = occurrences.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length;
    const averageResolutionHours = completed
      ? Number(
          (
            occurrences
              .filter((item) => item.status === OccurrenceStatus.CONCLUIDO && item.serviceOrders[0]?.finishedAt)
              .reduce((sum, item) => sum + ((item.serviceOrders[0].finishedAt!.getTime() - item.createdAt.getTime()) / 36e5), 0) /
            Math.max(
              1,
              occurrences.filter((item) => item.status === OccurrenceStatus.CONCLUIDO && item.serviceOrders[0]?.finishedAt).length
            )
          ).toFixed(1)
        )
      : 0;

    const topCategories = this.rank(occurrences.map((item) => item.category?.name ?? 'Sem categoria'));
    const topNeighborhoods = this.rank(occurrences.map((item) => item.neighborhood?.name ?? 'Sem bairro'));
    const avgSla = this.averageSla(occurrences);

    return {
      totalDemandas: total,
      demandasConcluidas: completed,
      tempoMedioHoras: averageResolutionHours,
      tempoMedioSlaHoras: avgSla,
      categoriasMaisFrequentes: topCategories.slice(0, 5),
      bairrosMaisAtendidos: topNeighborhoods.slice(0, 5)
    };
  }

  private rank(values: string[]) {
    const counts = values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }

  private averageSla(items: Array<{ serviceOrders: Array<{ slaHours: number | null }> }>) {
    const orders = items.flatMap((item) => item.serviceOrders);
    if (!orders.length) return 0;
    return Math.round(orders.reduce((sum, order) => sum + (order.slaHours ?? 0), 0) / orders.length);
  }
}
