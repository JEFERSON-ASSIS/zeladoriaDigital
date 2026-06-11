import { Injectable } from '@nestjs/common';
import { OccurrenceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportGrid(format: 'pdf' | 'csv' | 'xlsx', filters: Record<string, unknown>) {
    const occurrences = await this.prisma.occurrence.findMany({
      include: { category: true, neighborhood: true },
      orderBy: { createdAt: 'desc' }
    });

    const rows = occurrences.map((item) => ({
      protocol: item.protocol,
      status: item.status,
      priority: item.priority,
      category: item.category?.name ?? '',
      neighborhood: item.neighborhood?.name ?? '',
      createdAt: item.createdAt.toISOString()
    }));

    const summary = {
      format,
      filters,
      total: rows.length,
      completed: rows.filter((row) => row.status === OccurrenceStatus.CONCLUIDO).length
    };

    if (format === 'csv') {
      const header = 'protocol,status,priority,category,neighborhood,createdAt';
      const csvRows = rows.map((row) =>
        [row.protocol, row.status, row.priority, row.category, row.neighborhood, row.createdAt]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      );

      return {
        ...summary,
        contentType: 'text/csv',
        filename: `export-${Date.now()}.csv`,
        body: [header, ...csvRows].join('\n')
      };
    }

    if (format === 'xlsx') {
      return {
        ...summary,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `export-${Date.now()}.xlsx`,
        body: JSON.stringify({ rows, summary }, null, 2)
      };
    }

    return {
      ...summary,
      contentType: 'application/pdf',
      filename: `export-${Date.now()}.pdf`,
      body: JSON.stringify({ rows, summary, title: 'Relatório de Ocorrências' }, null, 2)
    };
  }
}
