import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { PriorityService } from '../src/modules/priority/priority.service';

describe('AnalyticsService', () => {
  const buildService = (overrides: any = {}) => {
    const prisma = {
      occurrence: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'occ-1',
            status: 'CONCLUIDO',
            priority: 'ALTA',
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            updatedAt: new Date('2026-06-02T12:00:00.000Z'),
            category: { name: 'Infraestrutura' },
            neighborhood: { name: 'Centro' },
            serviceOrders: [{ slaHours: 24 }],
            ratings: [{ score: 4 }]
          },
          {
            id: 'occ-2',
            status: 'ABERTO',
            priority: 'MEDIA',
            createdAt: new Date('2026-06-05T00:00:00.000Z'),
            updatedAt: new Date('2026-06-05T00:00:00.000Z'),
            category: { name: 'Limpeza' },
            neighborhood: { name: 'Centro' },
            serviceOrders: [{ slaHours: 48 }],
            ratings: []
          }
        ]),
      },
      department: {
        findMany: jest.fn().mockResolvedValue([{ id: 'dept-1', name: 'Obras' }])
      },
      indicatorCache: {
        upsert: jest.fn().mockResolvedValue({})
      },
      managerialAlert: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    };

    const priorityService = {
      calculateAndPersist: jest.fn().mockResolvedValue({ id: 'calc-1', score: 88, classification: 'ALTA' }),
      generateManagementSummary: jest.fn().mockReturnValue('Resumo de gestão')
    };

    return new AnalyticsService({ ...prisma, ...overrides.prisma } as any, { ...priorityService, ...overrides.priorityService } as any);
  };

  it('builds executive dashboard metrics and caches them', async () => {
    const service = buildService();
    const result = (await service.executiveDashboard({})) as any;

    expect(result.totalOccurrences).toBe(2);
    expect(result.completedOccurrences).toBe(1);
    expect(result.openOccurrences).toBe(1);
  });

  it('returns status indicators', async () => {
    const service = buildService();
    const result = (await service.statusIndicators({})) as any[];

    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBeGreaterThan(0);
  });

  it('generates executive summary', async () => {
    const service = buildService();
    const result = (await service.generateExecutiveSummary({})) as any;

    expect(result.summary).toBe('Resumo de gestão');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
