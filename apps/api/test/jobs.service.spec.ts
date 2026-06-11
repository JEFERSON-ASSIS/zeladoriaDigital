import { JobsService } from '../src/modules/jobs/jobs.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { PriorityService } from '../src/modules/priority/priority.service';
import { PriorityEngineService } from '../src/modules/priority/priority-engine.service';

describe('JobsService', () => {
  it('recalculates priority scores and refreshes indicators', async () => {
    const prisma = {
      occurrence: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'occ-1', address: 'Rua A', createdAt: new Date('2026-06-01T00:00:00.000Z'), priority: 'ALTA' }
        ]),
      },
      neighborhood: {
        findMany: jest.fn().mockResolvedValue([{ id: 'bairro-1', name: 'Centro', occurrences: [] }])
      },
      heatmapCache: {
        upsert: jest.fn().mockResolvedValue({})
      }
    };

    const analyticsService = {
      refreshAllIndicators: jest.fn().mockResolvedValue(true),
      generateManagerialAlerts: jest.fn().mockResolvedValue([{ id: 'alert-1' }])
    };

    const priorityService = {
      calculateAndPersist: jest.fn().mockResolvedValue({ id: 'calc-1' })
    };

    const priorityEngineService = {
      calculatePriority: jest.fn().mockResolvedValue({ id: 'engine-1' })
    };

    const service = new JobsService(prisma as any, analyticsService as any, priorityService as any, priorityEngineService as any);

    const priorityResult = await service.recalculatePriorityScores();
    const indicatorResult = await service.refreshIndicatorsAndAlerts();
    const heatmapResult = await service.refreshHeatmapCache();

    expect(priorityResult.processed).toBe(1);
    expect(indicatorResult.alerts).toBe(1);
    expect(heatmapResult.processed).toBe(1);
    expect(priorityService.calculateAndPersist).toHaveBeenCalled();
    expect(analyticsService.refreshAllIndicators).toHaveBeenCalled();
  });
});
