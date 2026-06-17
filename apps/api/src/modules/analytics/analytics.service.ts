import { Injectable } from '@nestjs/common';
import { AlertLevel, OccurrenceStatus, PriorityLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriorityService } from '../priority/priority.service';
import { GlobalFiltersDto } from './dto/global-filters.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priorityService: PriorityService
  ) {}

  async executiveDashboard(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const total = items.length;
    const completed = items.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length;
    const payload = {
      totalOccurrences: total,
      openOccurrences: items.filter((item) => item.status === OccurrenceStatus.ABERTO).length,
      inProgressOccurrences: items.filter((item) =>
        ([OccurrenceStatus.EM_ANALISE, OccurrenceStatus.ENCAMINHADO, OccurrenceStatus.EM_EXECUCAO] as OccurrenceStatus[]).includes(item.status)
      ).length,
      completedOccurrences: completed,
      canceledOccurrences: items.filter((item) => item.status === OccurrenceStatus.CANCELADO).length,
      reopenedOccurrences: 0,
      overdueOccurrences: this.calculateOverdue(items),
      averageResolutionHours: this.calculateAverageResolutionHours(items),
      averageFirstResponseHours: this.calculateAverageFirstResponseHours(items),
      resolutionRate: total ? Math.round((completed / total) * 100) : 0,
      satisfactionIndex: this.calculateAverageSatisfaction(items)
    };
    return this.cacheIndicator('executive-dashboard', filters, payload);
  }

  async statusIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const total = items.length;
    return this.cacheIndicator(
      'status-indicators',
      filters,
      Object.values(OccurrenceStatus).map((status) => {
        const quantity = items.filter((item) => item.status === status).length;
        return { status, quantity, percentage: total ? Number(((quantity / total) * 100).toFixed(1)) : 0, evolution: quantity };
      })
    );
  }

  async departmentIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const departments = await this.prisma.department.findMany();
    return this.cacheIndicator(
      'department-indicators',
      filters,
      departments.map((department) => {
        const scoped = items.filter((item) => item.serviceOrders.some((order) => order.departmentId === department.id));
        const completed = scoped.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length;
        return {
          departmentId: department.id,
          departmentName: department.name,
          totalReceived: scoped.length,
          totalCompleted: completed,
          totalOverdue: this.calculateOverdue(scoped),
          averageSlaHours: this.calculateAverageSla(scoped),
          averageResolutionHours: this.calculateAverageResolutionHours(scoped),
          completionRate: scoped.length ? Number(((completed / scoped.length) * 100).toFixed(1)) : 0,
          reopeningRate: 0,
          criticalDemands: scoped.filter((item) => item.priority === PriorityLevel.URGENTE).length
        };
      })
    );
  }

  async categoryIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const grouped = this.groupBy(items, (item) => item.category?.name ?? 'Sem categoria');
    const list = Object.entries(grouped).map(([category, scoped]) => ({
      category,
      quantity: scoped.length,
      mostRequested: category,
      biggestDelay: this.calculateOverdue(scoped),
      recurrence: scoped.length,
      socialImpact: scoped.length > 5 ? 'ALTO' : 'MÉDIO'
    }));
    return this.cacheIndicator('category-indicators', filters, list);
  }

  async neighborhoodIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const grouped = this.groupBy(items, (item) => item.neighborhood?.name ?? 'Sem bairro');
    const list = Object.entries(grouped).map(([neighborhood, scoped]) => ({
      neighborhood,
      total: scoped.length,
      open: scoped.filter((item) => item.status === OccurrenceStatus.ABERTO).length,
      completed: scoped.filter((item) => item.status === OccurrenceStatus.CONCLUIDO).length,
      overdue: this.calculateOverdue(scoped),
      dominantCategory: this.pickDominantCategory(scoped),
      averageSlaHours: this.calculateAverageSla(scoped),
      recurrenceIndex: scoped.length
    }));
    return this.cacheIndicator('neighborhood-indicators', filters, list);
  }

  async ranking(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const calculations = await Promise.all(items.map((item) => this.priorityService.calculateAndPersist(item.id, item)));
    return {
      city: this.buildRankingList(items, calculations),
      neighborhoods: this.groupRanking(items, calculations, (item) => item.neighborhood?.name ?? 'Sem bairro'),
      departments: this.groupRanking(items, calculations, (item) => item.serviceOrders[0]?.department?.name ?? item.suggestedDepartment?.name ?? 'Sem secretaria'),
      categories: this.groupRanking(items, calculations, (item) => item.category?.name ?? 'Sem categoria')
    };
  }

  async recalculatePrioritization() {
    return this.ranking({});
  }

  async refreshAllIndicators(filters: GlobalFiltersDto = {}) {
    await this.executiveDashboard(filters);
    await this.statusIndicators(filters);
    await this.departmentIndicators(filters);
    await this.categoryIndicators(filters);
    await this.neighborhoodIndicators(filters);
    return true;
  }

  async alerts() {
    const existing = await this.prisma.managerialAlert.findMany({ orderBy: { createdAt: 'desc' } });
    if (existing.length) return existing;
    const overdue = await this.prisma.occurrence.findMany({
      where: { status: { not: OccurrenceStatus.CONCLUIDO } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    await this.prisma.managerialAlert.createMany({
      data: overdue.map((item) => ({
        type: 'SLA_OVERDUE',
        title: `SLA vencido: ${item.protocol}`,
        message: item.title ?? item.description,
        level: AlertLevel.WARNING,
        occurrenceId: item.id,
        neighborhoodId: item.neighborhoodId
      }))
    });
    return this.prisma.managerialAlert.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async generateManagerialAlerts() {
    const openOccurrences = await this.prisma.occurrence.findMany({
      where: { status: { not: OccurrenceStatus.CONCLUIDO } },
      include: {
        neighborhood: true,
        serviceOrders: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const alerts: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      level: AlertLevel;
      occurrenceId?: string;
      neighborhoodId?: string | null;
    }> = [];

    for (const item of openOccurrences) {
      const ageHours = (Date.now() - item.createdAt.getTime()) / 36e5;
      const firstOrder = item.serviceOrders[0];
      const slaHours = firstOrder?.slaHours ?? this.getDefaultSla(item.priority);
      const dueSoon = slaHours ? ageHours >= slaHours * 0.8 && ageHours < slaHours : false;
      const overdue = slaHours ? ageHours >= slaHours : false;

      if (overdue) {
        alerts.push({
          id: `SLA_OVERDUE-${item.id}`,
          type: 'SLA_OVERDUE',
          title: `SLA vencido: ${item.protocol}`,
          message: item.title ?? item.description,
          level: AlertLevel.WARNING,
          occurrenceId: item.id,
          neighborhoodId: item.neighborhoodId
        });
      } else if (dueSoon) {
        alerts.push({
          id: `SLA_RISK-${item.id}`,
          type: 'SLA_RISK',
          title: `SLA em risco: ${item.protocol}`,
          message: item.title ?? item.description,
          level: AlertLevel.INFO,
          occurrenceId: item.id,
          neighborhoodId: item.neighborhoodId
        });
      }
    }

    const byNeighborhood = openOccurrences.reduce<Record<string, number>>((acc, item) => {
      const key = item.neighborhood?.name ?? 'Sem bairro';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    for (const [neighborhood, quantity] of Object.entries(byNeighborhood)) {
      if (quantity >= 5) {
        const scope = openOccurrences.find((item) => (item.neighborhood?.name ?? 'Sem bairro') === neighborhood);
        alerts.push({
          id: `ACCUMULATION-${neighborhood}`,
          type: 'ACCUMULATION',
          title: `Acúmulo de demandas em ${neighborhood}`,
          message: `Há ${quantity} ocorrências abertas no bairro.`,
          level: quantity >= 10 ? AlertLevel.CRITICAL : AlertLevel.WARNING,
          neighborhoodId: scope?.neighborhoodId
        });
      }
    }

    const completedToday = await this.prisma.occurrence.count({
      where: {
        status: OccurrenceStatus.CONCLUIDO,
        updatedAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        }
      }
    });
    const openToday = openOccurrences.filter((item) => item.createdAt.getTime() >= Date.now() - 1000 * 60 * 60 * 24).length;
    if (openToday > completedToday * 2 && openToday >= 8) {
      alerts.push({
        id: `LOW_PRODUCTIVITY-${new Date().toISOString().slice(0, 10)}`,
        type: 'LOW_PRODUCTIVITY',
        title: 'Baixa produtividade operacional',
        message: `Aberturas de hoje: ${openToday} | Conclusões de hoje: ${completedToday}.`,
        level: AlertLevel.WARNING
      });
    }

    const existingIds = new Set(
      (await this.prisma.managerialAlert.findMany({ select: { id: true } })).map((alert) => alert.id)
    );

    for (const alert of alerts) {
      if (existingIds.has(alert.id)) {
        await this.prisma.managerialAlert.update({
          where: { id: alert.id },
          data: {
            type: alert.type,
            title: alert.title,
            message: alert.message,
            level: alert.level,
            occurrenceId: alert.occurrenceId,
            neighborhoodId: alert.neighborhoodId,
            read: false
          }
        });
        continue;
      }

      await this.prisma.managerialAlert.create({
        data: {
          id: alert.id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          level: alert.level,
          occurrenceId: alert.occurrenceId,
          neighborhoodId: alert.neighborhoodId
        }
      });
    }

    return this.prisma.managerialAlert.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async generateExecutiveSummary(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    return {
      summary: this.priorityService.generateManagementSummary(items),
      mainProblems: items.slice(0, 5).map((item) => item.title ?? item.description),
      criticalDepartments: this.groupRanking(items, [], (item) => item.serviceOrders[0]?.department?.name ?? item.suggestedDepartment?.name ?? 'Sem secretaria').slice(0, 3),
      criticalNeighborhoods: this.groupRanking(items, [], (item) => item.neighborhood?.name ?? 'Sem bairro').slice(0, 3),
      trends: ['Demanda concentrada em infraestrutura'],
      recommendations: ['Priorizar SLAs críticos', 'Redistribuir equipes']
    };
  }

  async generateSlaIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const totalOrders = items.flatMap((item) => item.serviceOrders);
    const overdueOrders = totalOrders.filter((order) => {
      if (!order.slaHours || !order.createdAt) return false;
      return Date.now() - order.createdAt.getTime() > order.slaHours * 36e5;
    });
    return {
      totalOrders: totalOrders.length,
      overdueOrders: overdueOrders.length,
      averageSlaHours: this.calculateAverageSla(items),
      onTimeRate: totalOrders.length ? Math.round(((totalOrders.length - overdueOrders.length) / totalOrders.length) * 100) : 0
    };
  }

  private async loadOccurrences(filters: GlobalFiltersDto) {
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
    if (filters.departmentId) where.serviceOrders = { some: { departmentId: filters.departmentId } };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.neighborhoodId) where.neighborhoodId = filters.neighborhoodId;
    if (filters.status) where.status = filters.status as OccurrenceStatus;
    if (filters.priority) where.priority = filters.priority as PriorityLevel;
    return this.prisma.occurrence.findMany({
      where,
      include: { category: true, neighborhood: true, citizen: true, serviceOrders: { include: { department: true } }, suggestedDepartment: true, ratings: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  private async cacheIndicator(indicatorType: string, filters: GlobalFiltersDto, value: unknown) {
    const cacheKey = `${indicatorType}:${JSON.stringify(filters)}`;
    await this.prisma.indicatorCache.upsert({
      where: { cacheKey },
      create: { indicatorType, cacheKey, value: value as Prisma.InputJsonValue, filtersJson: filters as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue, filtersJson: filters as Prisma.InputJsonValue }
    });
    return value;
  }

  private calculateAverageResolutionHours(items: Array<{ createdAt: Date; updatedAt: Date; status: OccurrenceStatus }>) {
    const finished = items.filter((item) => item.status === OccurrenceStatus.CONCLUIDO);
    if (!finished.length) return 0;
    const total = finished.reduce((sum, item) => sum + (item.updatedAt.getTime() - item.createdAt.getTime()) / 36e5, 0);
    return Number((total / finished.length).toFixed(1));
  }

  private calculateAverageFirstResponseHours(items: Array<{ createdAt: Date; serviceOrders: Array<{ createdAt: Date }> }>) {
    const responses = items
      .map((item) => {
        const first = item.serviceOrders
          .slice()
          .filter((order) => order.createdAt instanceof Date)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        return first && item.createdAt instanceof Date ? (first.createdAt.getTime() - item.createdAt.getTime()) / 36e5 : null;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value));
    if (!responses.length) return 0;
    return Number((responses.reduce((sum, value) => sum + value, 0) / responses.length).toFixed(1));
  }

  private calculateAverageSla(items: Array<{ serviceOrders: Array<{ slaHours: number | null }> }>) {
    const orders = items.flatMap((item) => item.serviceOrders);
    if (!orders.length) return 0;
    return Math.round(orders.reduce((sum, order) => sum + (order.slaHours ?? 0), 0) / orders.length);
  }

  private calculateAverageSatisfaction(items: Array<{ ratings: Array<{ score: number }> }>) {
    const ratings = items.flatMap((item) => item.ratings);
    if (!ratings.length) return 0;
    return Math.round(ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length);
  }

  private getDefaultSla(priority: OccurrenceStatus | PriorityLevel) {
    switch (priority) {
      case PriorityLevel.URGENTE:
        return 4;
      case PriorityLevel.ALTA:
        return 12;
      case PriorityLevel.MEDIA:
        return 24;
      case PriorityLevel.BAIXA:
      default:
        return 48;
    }
  }

  private calculateOverdue(items: Array<{ createdAt: Date; status: OccurrenceStatus }>) {
    return items.filter((item) => item.status !== OccurrenceStatus.CONCLUIDO && Date.now() - item.createdAt.getTime() > 1000 * 60 * 60 * 24 * 3).length;
  }

  private pickDominantCategory(items: Array<{ category?: { name: string } | null }>) {
    const grouped = this.groupBy(items, (item) => item.category?.name ?? 'Sem categoria');
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)[0]?.[0] ?? 'Sem categoria';
  }

  private groupBy<T>(items: T[], fn: (item: T) => string) {
    return items.reduce<Record<string, T[]>>((acc, item) => {
      const key = fn(item);
      acc[key] = acc[key] ?? [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  private buildRankingList(
    items: Awaited<ReturnType<typeof this.loadOccurrences>>,
    calculations: Array<{ occurrenceId: string; score: number; classification: string }>
  ) {
    const byOccurrence = new Map(calculations.map((item) => [item.occurrenceId, item]));
    return items
      .map((item) => {
        const calc = byOccurrence.get(item.id);
        return {
          id: item.id,
          protocol: item.protocol,
          title: item.title ?? item.description,
          neighborhood: item.neighborhood?.name ?? 'Sem bairro',
          category: item.category?.name ?? 'Sem categoria',
          department: item.serviceOrders[0]?.department?.name ?? item.suggestedDepartment?.name ?? 'Sem secretaria',
          score: calc?.score ?? item.priorityScore,
          classification: calc?.classification ?? item.priority,
          createdAt: item.createdAt
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private groupRanking(
    items: Awaited<ReturnType<typeof this.loadOccurrences>>,
    calculations: Array<{ occurrenceId: string; score: number; classification: string }>,
    labelFn: (item: Awaited<ReturnType<typeof this.loadOccurrences>>[number]) => string
  ) {
    const byOccurrence = new Map(calculations.map((item) => [item.occurrenceId, item]));
    const grouped = this.groupBy(items, labelFn);
    return Object.entries(grouped)
      .map(([label, scoped]) => ({
        label,
        total: scoped.length,
        averageScore: Math.round(scoped.reduce((sum, item) => sum + (byOccurrence.get(item.id)?.score ?? item.priorityScore), 0) / scoped.length),
        urgent: scoped.filter((item) => (byOccurrence.get(item.id)?.classification ?? item.priority) === 'URGENTE').length
      }))
      .sort((a, b) => b.total - a.total);
  }
}
