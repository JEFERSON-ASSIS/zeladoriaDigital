import { AnalyticsController } from '../src/modules/analytics/analytics.controller';

describe('AnalyticsController', () => {
  const service = {
    executiveDashboard: jest.fn().mockResolvedValue({ totalOccurrences: 2 }),
    statusIndicators: jest.fn().mockResolvedValue([{ status: 'ABERTO', quantity: 1 }]),
    departmentIndicators: jest.fn().mockResolvedValue([{ departmentId: 'dept-1' }]),
    categoryIndicators: jest.fn().mockResolvedValue([{ category: 'Infraestrutura' }]),
    neighborhoodIndicators: jest.fn().mockResolvedValue([{ neighborhood: 'Centro' }]),
    ranking: jest.fn().mockResolvedValue([{ id: 'calc-1' }]),
    recalculatePrioritization: jest.fn().mockResolvedValue(true),
    alerts: jest.fn().mockResolvedValue([{ id: 'alert-1' }]),
    generateExecutiveSummary: jest.fn().mockResolvedValue({ summary: 'Resumo' })
  };

  const controller = new AnalyticsController(service as any);

  it('forwards dashboard request to service', async () => {
    const result = (await controller.executiveDashboard({ departmentId: 'dept-1' } as any)) as any;
    expect(service.executiveDashboard).toHaveBeenCalledWith({ departmentId: 'dept-1' });
    expect(result.totalOccurrences).toBe(2);
  });

  it('forwards alert and summary actions', async () => {
    await controller.alerts();
    await controller.executiveSummary({ periodStart: '2026-06-01' } as any);

    expect(service.alerts).toHaveBeenCalled();
    expect(service.generateExecutiveSummary).toHaveBeenCalledWith({ periodStart: '2026-06-01' });
  });
});
