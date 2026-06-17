import { Injectable } from '@nestjs/common';
import { OccurrenceStatus, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

type ExportFormat = 'pdf' | 'csv' | 'xlsx';

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportGrid(format: ExportFormat, filters: Record<string, unknown>) {
    const where = this.buildWhere(filters);
    const occurrences = await this.prisma.occurrence.findMany({
      where,
      include: { category: true, neighborhood: true, serviceOrders: { include: { department: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const rows = occurrences.map((item) => ({
      protocol: item.protocol,
      status: item.status,
      priority: item.priority,
      category: item.category?.name ?? '',
      neighborhood: item.neighborhood?.name ?? '',
      department: item.serviceOrders?.[0]?.department?.name ?? '',
      createdAt: item.createdAt.toISOString()
    }));

    const summary = {
      format,
      filters,
      total: rows.length,
      completed: rows.filter((row) => row.status === OccurrenceStatus.CONCLUIDO).length
    };

    if (format === 'csv') {
      return {
        ...summary,
        contentType: 'text/csv',
        filename: `export-${Date.now()}.csv`,
        body: this.buildCsv(rows)
      };
    }

    if (format === 'xlsx') {
      return {
        ...summary,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `export-${Date.now()}.xlsx`,
        body: await this.buildXlsx(rows, summary)
      };
    }

    return {
      ...summary,
      contentType: 'application/pdf',
      filename: `export-${Date.now()}.pdf`,
      body: await this.buildPdf(rows, summary)
    };
  }

  private buildWhere(filters: Record<string, unknown>): Prisma.OccurrenceWhereInput {
    const where: Prisma.OccurrenceWhereInput = {};

    if (filters.periodStart || filters.periodEnd) {
      where.createdAt = {};
      if (filters.periodStart) where.createdAt.gte = new Date(String(filters.periodStart));
      if (filters.periodEnd) {
        const end = new Date(String(filters.periodEnd));
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (filters.categoryId) where.categoryId = String(filters.categoryId);
    if (filters.neighborhoodId) where.neighborhoodId = String(filters.neighborhoodId);
    if (filters.status) where.status = String(filters.status) as OccurrenceStatus;
    if (filters.priority) where.priority = String(filters.priority) as never;
    if (filters.departmentId) where.serviceOrders = { some: { departmentId: String(filters.departmentId) } };

    return where;
  }

  private buildCsv(rows: Array<Record<string, string>>) {
    const header = ['protocol', 'status', 'priority', 'category', 'neighborhood', 'department', 'createdAt'];
    const csvRows = rows.map((row) =>
      header.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')
    );

    return [header.join(','), ...csvRows].join('\n');
  }

  private async buildXlsx(rows: Array<Record<string, string>>, summary: Record<string, unknown>) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Ocorrencias');
    sheet.columns = [
      { header: 'Protocol', key: 'protocol', width: 18 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Category', key: 'category', width: 24 },
      { header: 'Neighborhood', key: 'neighborhood', width: 24 },
      { header: 'Department', key: 'department', width: 24 },
      { header: 'Created At', key: 'createdAt', width: 24 }
    ];
    sheet.addRows(rows);

    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.addRows(Object.entries(summary).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));

    return workbook.xlsx.writeBuffer();
  }

  private async buildPdf(rows: Array<Record<string, string>>, summary: Record<string, unknown>) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer | Uint8Array | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text('Relatorio de Ocorrencias', { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Total: ${summary.total ?? 0}`);
    doc.text(`Concluidas: ${summary.completed ?? 0}`);
    doc.moveDown();

    rows.slice(0, 30).forEach((row, index) => {
      doc.fontSize(10).text(
        `${index + 1}. ${row.protocol} | ${row.status} | ${row.priority} | ${row.category} | ${row.neighborhood} | ${row.department}`
      );
    });

    doc.end();
    return finished;
  }
}
