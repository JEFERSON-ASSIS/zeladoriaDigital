import { ExportService } from '../src/modules/export/export.service';

describe('ExportService', () => {
  it('builds csv export payload', async () => {
    const prisma = {
      occurrence: {
        findMany: jest.fn().mockResolvedValue([
          {
            protocol: 'OC-1',
            status: 'CONCLUIDO',
            priority: 'ALTA',
            createdAt: new Date('2026-06-01T00:00:00.000Z'),
            category: { name: 'Infraestrutura' },
            neighborhood: { name: 'Centro' }
          }
        ])
      }
    };

    const service = new ExportService(prisma as any);
    const result = await service.exportGrid('csv', {});

    expect(result.contentType).toBe('text/csv');
    expect(result.body).toContain('protocol,status,priority');
    expect(result.body).toContain('OC-1');
  });
});
