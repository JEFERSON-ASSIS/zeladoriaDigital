import { Injectable } from '@nestjs/common';
import { Occurrence } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriorityEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculatePriority(occurrence: Pick<Occurrence, 'id' | 'address' | 'createdAt' | 'priority'>) {
    const score = this.generateFinalScore({
      risk: this.calculateRiskScore(occurrence),
      location: this.calculateLocationScore(occurrence),
      duplicate: this.calculateDuplicateScore(occurrence),
      time: this.calculateTimeScore(occurrence),
      category: this.calculateCategoryScore(occurrence)
    });
    const classification = this.classify(score);
    return this.prisma.priorityCalculation.upsert({
      where: { occurrenceId: occurrence.id },
      create: { occurrenceId: occurrence.id, score, classification, detailsJson: { source: 'engine' } },
      update: { score, classification, detailsJson: { source: 'engine' } }
    });
  }

  calculateRiskScore(input: Pick<Occurrence, 'priority'>) {
    return input.priority === 'URGENTE' ? 35 : input.priority === 'ALTA' ? 25 : 10;
  }

  calculateLocationScore(input: Pick<Occurrence, 'address'>) {
    return /escola|hospital|posto|creche/i.test(input.address) ? 20 : 5;
  }

  calculateDuplicateScore(_input: Pick<Occurrence, 'id'>) {
    return 10;
  }

  calculateTimeScore(input: Pick<Occurrence, 'createdAt'>) {
    const hours = (Date.now() - input.createdAt.getTime()) / 36e5;
    return Math.min(30, Math.round(hours / 2));
  }

  calculateCategoryScore(_input: Pick<Occurrence, 'id'>) {
    return 15;
  }

  generateFinalScore(parts: { risk: number; location: number; duplicate: number; time: number; category: number }) {
    return parts.risk + parts.location + parts.duplicate + parts.time + parts.category;
  }

  classify(score: number) {
    if (score > 100) return 'CRITICA';
    if (score >= 81) return 'URGENTE';
    if (score >= 61) return 'ALTA';
    if (score >= 31) return 'MEDIA';
    return 'BAIXA';
  }
}
