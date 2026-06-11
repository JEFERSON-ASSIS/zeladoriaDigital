import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AnalyticsController } from '../src/modules/analytics/analytics.controller';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';

describe('AnalyticsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: {
            executiveDashboard: jest.fn().mockResolvedValue({ totalOccurrences: 2 }),
            statusIndicators: jest.fn().mockResolvedValue([{ status: 'ABERTO', quantity: 1 }]),
            departmentIndicators: jest.fn().mockResolvedValue([{ departmentId: 'dept-1' }]),
            categoryIndicators: jest.fn().mockResolvedValue([{ category: 'Infraestrutura' }]),
            neighborhoodIndicators: jest.fn().mockResolvedValue([{ neighborhood: 'Centro' }]),
            ranking: jest.fn().mockResolvedValue([{ id: 'calc-1' }]),
            recalculatePrioritization: jest.fn().mockResolvedValue(true),
            alerts: jest.fn().mockResolvedValue([{ id: 'alert-1' }]),
            generateExecutiveSummary: jest.fn().mockResolvedValue({ summary: 'Resumo' })
          }
        }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /admin/dashboard/executive returns dashboard payload', async () => {
    await request(app.getHttpServer()).get('/admin/dashboard/executive').expect(200).expect({ totalOccurrences: 2 });
  });
});
