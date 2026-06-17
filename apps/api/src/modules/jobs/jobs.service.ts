import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PriorityService } from '../priority/priority.service';
import { PriorityEngineService } from '../priority/priority-engine.service';
import { ReportsService } from '../reports/reports.service';
import { ExportService } from '../export/export.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly priorityService: PriorityService,
    private readonly priorityEngineService: PriorityEngineService,
    private readonly reportsService: Pick<ReportsService, 'generate'> = {
      generate: async () => ({
        totalOccurrences: 0,
        completedOccurrences: 0,
        openOccurrences: 0,
        overdueOccurrences: 0,
        averageSlaHours: 0,
        averageResolutionHours: 0,
        topNeighborhoods: [],
        topCategories: [],
        topDepartments: [],
        executiveSummary: 'Relatório indisponível'
      })
    } as unknown as Pick<ReportsService, 'generate'>,
    private readonly exportService: Pick<ExportService, 'exportGrid'> = {
      exportGrid: async (format: 'pdf' | 'csv' | 'xlsx') => ({
        format,
        contentType: 'text/plain',
        filename: `export.${format}`,
        body: ''
      })
    } as unknown as Pick<ExportService, 'exportGrid'>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async recalculatePriorityScores() {
    const occurrences = await this.prisma.occurrence.findMany({
      select: { id: true, address: true, createdAt: true, priority: true }
    });

    for (const occurrence of occurrences) {
      await this.priorityService.calculateAndPersist(occurrence.id, occurrence);
      await this.priorityEngineService.calculatePriority(occurrence);
    }

    this.logger.log(`Priority recalculated for ${occurrences.length} occurrences`);
    return { processed: occurrences.length };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async refreshIndicatorsAndAlerts() {
    await this.analyticsService.refreshAllIndicators({});
    const alerts = await this.analyticsService.generateManagerialAlerts();
    this.logger.log(`Indicators refreshed and ${alerts.length} alerts available`);
    return { alerts: alerts.length };
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async refreshHeatmapCache() {
    const neighborhoods = await this.prisma.neighborhood.findMany({
      include: {
        occurrences: {
          include: { category: true }
        }
      }
    });

    for (const neighborhood of neighborhoods) {
      await this.prisma.heatmapCache.upsert({
        where: {
          id: neighborhood.id
        },
        create: {
          id: neighborhood.id,
          bairro: neighborhood.name,
          quantidade: neighborhood.occurrences.length
        },
        update: {
          bairro: neighborhood.name,
          quantidade: neighborhood.occurrences.length
        }
      });
    }

    this.logger.log(`Heatmap cache refreshed for ${neighborhoods.length} neighborhoods`);
    return { processed: neighborhoods.length };
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async generateDailyReportsAndExports() {
    const report = await this.reportsService.generate({});
    const csv = await this.exportService.exportGrid('csv', {});
    const xlsx = await this.exportService.exportGrid('xlsx', {});
    const pdf = await this.exportService.exportGrid('pdf', {});

    this.logger.log(
      `Daily reports prepared: total=${report.totalOccurrences}, exports=[${csv.format}, ${xlsx.format}, ${pdf.format}]`
    );

    return {
      report,
      exports: [csv.filename, xlsx.filename, pdf.filename]
    };
  }
}
