import { OccurrencesService } from '../src/modules/occurrences/occurrences.service';
import { PriorityService } from '../src/modules/priority/priority.service';

describe('OccurrencesService', () => {
  it('creates an occurrence with a generated protocol', async () => {
    const prisma = {
      occurrence: {
        create: jest.fn().mockResolvedValue({
          id: 'occ-1',
          protocol: 'OC-123',
          description: 'Buraco na rua',
          address: 'Rua A'
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'occ-1',
          protocol: 'OC-123',
          description: 'Buraco na rua',
          address: 'Rua A'
        }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn()
      },
      occurrenceMovement: {
        create: jest.fn().mockResolvedValue({
          id: 'mov-1'
        })
      },
      department: {
        findMany: jest.fn().mockResolvedValue([])
      },
      category: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };

    const priorityService = {
      calculatePriority: jest.fn().mockReturnValue({ level: 'MEDIA', score: 30 }),
      detectPossibleDuplicate: jest.fn().mockResolvedValue(null),
      suggestDepartment: jest.fn().mockReturnValue(null)
    };
    const service = new OccurrencesService(prisma as any, priorityService as any);
    const result = await service.create({
      description: 'Buraco na rua',
      address: 'Rua A'
    });

    expect(prisma.occurrence.create).toHaveBeenCalled();
    expect(result?.protocol).toContain('OC-');
  });

  it('removes an occurrence', async () => {
    const prisma = {
      occurrence: {
        delete: jest.fn().mockResolvedValue({ id: 'occ-1' })
      },
      department: {
        findMany: jest.fn().mockResolvedValue([])
      },
      category: {
        findUnique: jest.fn().mockResolvedValue(null)
      }
    };

    const priorityService = {
      calculatePriority: jest.fn().mockReturnValue({ level: 'MEDIA', score: 30 }),
      detectPossibleDuplicate: jest.fn().mockResolvedValue(null),
      suggestDepartment: jest.fn().mockReturnValue(null)
    };
    const service = new OccurrencesService(prisma as any, priorityService as any);
    const result = await service.remove('occ-1');

    expect(prisma.occurrence.delete).toHaveBeenCalledWith({ where: { id: 'occ-1' } });
    expect(result.id).toBe('occ-1');
  });
});
