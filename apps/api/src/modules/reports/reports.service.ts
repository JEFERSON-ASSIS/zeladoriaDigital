import { Injectable } from '@nestjs/common';
import { OccurrenceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(input: { periodStart?: string; periodEnd?: string }) {
    const where: Prisma.OccurrenceWhereInput = {};
    if (input.periodStart || input.periodEnd) {
      where.createdAt = {};
      if (input.periodStart) where.createdAt.gte = new Date(input.periodStart);
      if (input.periodEnd) {
        const end = new Date(input.periodEnd);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const items = await this.prisma.occurrence.findMany({
      where,
      include: { category: true, neighborhood: true, serviceOrders: { include: { department: true } }, suggestedDepartment: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      totalOccurrences: items.length,
      completedOccurrences: items.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length,
      openOccurrences: items.filter((item) => item.status === OccurrenceStatus.ABERTO).length,
      overdueOccurrences: items.filter((item) => item.status !== OccurrenceStatus.CONCLUIDO).length,
      averageSlaHours: this.averageSla(items),
      averageResolutionHours: this.averageResolution(items),
      topNeighborhoods: this.rank(items.map((item) => item.neighborhood?.name ?? 'Sem bairro')),
      topCategories: this.rank(items.map((item) => item.category?.name ?? 'Sem categoria')),
      topDepartments: this.rank(items.map((item) => item.serviceOrders[0]?.department?.name ?? item.suggestedDepartment?.name ?? 'Sem secretaria')),
      executiveSummary: `Relatório gerado para o período ${input.periodStart ?? 'início'} até ${input.periodEnd ?? 'fim'}.`
    };
  }

  download(format: 'pdf' | 'csv' | 'xlsx') {
    return {
      format,
      status: 'queued',
      message: `Exportação ${format.toUpperCase()} preparada em mock para a fase atual.`
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

  private averageResolution(items: Array<{ createdAt: Date; updatedAt: Date; status: OccurrenceStatus }>) {
    const completed = items.filter((item) => item.status === OccurrenceStatus.CONCLUIDO);
    if (!completed.length) return 0;
    return Number(
      (completed.reduce((sum, item) => sum + (item.updatedAt.getTime() - item.createdAt.getTime()) / 36e5, 0) / completed.length).toFixed(1)
    );
  }
}
