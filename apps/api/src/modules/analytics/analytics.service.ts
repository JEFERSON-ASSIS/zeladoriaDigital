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
      resolutionRate: total ? Math.round((completed / total) * 100) : 0,
      satisfactionIndex: this.calculateAverageSatisfaction(items)
    };
    return this.cacheIndicator('executive-dashboard', filters, payload);
  }

  async statusIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const total = items.length;
    return this.cacheIndicator('status-indicators', filters, Object.values(OccurrenceStatus).map((status) => {
      const quantity = items.filter((item) => item.status === status).length;
      return { status, quantity, percentage: total ? Number(((quantity / total) * 100).toFixed(1)) : 0, evolution: quantity };
    }));
  }

  async departmentIndicators(filters: GlobalFiltersDto = {}) {
    const items = await this.loadOccurrences(filters);
    const departments = await this.prisma.department.findMany();
    return this.cacheIndicator('department-indicators', filters, departments.map((department) => {
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
    }));
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
    return Promise.all(items.map((item) => this.priorityService.calculateAndPersist(item.id, item)));
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
    const overdue = await this.prisma.occurrence.findMany({
      where: { status: { not: OccurrenceStatus.CONCLUIDO } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const data = overdue.map((item) => ({
      type: 'SLA_OVERDUE',
      title: `SLA vencido: ${item.protocol}`,
      message: item.title ?? item.description,
      level: AlertLevel.WARNING,
      occurrenceId: item.id,
      neighborhoodId: item.neighborhoodId
    }));

    for (const item of data) {
      await this.prisma.managerialAlert.upsert({
        where: {
          id: `${item.type}-${item.occurrenceId}`
        },
        create: {
          ...item,
          id: `${item.type}-${item.occurrenceId}`
        },
        update: {
          ...item
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
      criticalDepartments: [],
      criticalNeighborhoods: [],
      trends: ['Demanda concentrada em infraestrutura'],
      recommendations: ['Priorizar SLAs críticos', 'Redistribuir equipes']
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
      include: { category: true, neighborhood: true, citizen: true, serviceOrders: true, ratings: true },
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
}
