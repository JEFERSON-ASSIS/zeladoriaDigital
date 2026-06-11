import { Injectable } from '@nestjs/common';
import { OccurrenceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(input: { periodStart?: string; periodEnd?: string }) {
    const items = await this.prisma.occurrence.findMany({
      include: { category: true, neighborhood: true, serviceOrders: true },
      orderBy: { createdAt: 'desc' }
    });

    return {
      totalOccurrences: items.length,
      completedOccurrences: items.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length,
      openOccurrences: items.filter((item) => item.status === OccurrenceStatus.ABERTO).length,
      overdueOccurrences: items.filter((item) => item.status !== OccurrenceStatus.CONCLUIDO).length,
      topNeighborhoods: this.rank(items.map((item) => item.neighborhood?.name ?? 'Sem bairro')),
      topCategories: this.rank(items.map((item) => item.category?.name ?? 'Sem categoria')),
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
}
