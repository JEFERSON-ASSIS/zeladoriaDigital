import { Injectable } from '@nestjs/common';
import { Category, Department, Occurrence, PriorityLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriorityService {
  constructor(private readonly prisma: PrismaService) {}

  calculatePriority(input: { title?: string | null; description: string; category?: Pick<Category, 'name'> | null; address?: string | null; citizen?: { id: string } | null }) {
    const text = `${input.title ?? ''} ${input.description} ${input.category?.name ?? ''} ${input.address ?? ''}`.toLowerCase();
    let score = 0;

    if (/(buraco|queda|vazamento|alagamento|risco|incêndio|incendio|emergência|emergencia)/.test(text)) score += 70;
    if (/(escola|posto de sa[úu]de|hospital|creche|pra[çc]a|ilumina|lixo|entulho)/.test(text)) score += 20;
    if ((input.title ?? '').length > 0) score += 5;
    if (input.category?.name?.toLowerCase().includes('infra')) score += 10;

    if (score >= 80) return { level: PriorityLevel.URGENTE, score };
    if (score >= 50) return { level: PriorityLevel.ALTA, score };
    if (score >= 25) return { level: PriorityLevel.MEDIA, score };
    return { level: PriorityLevel.BAIXA, score };
  }

  detectPossibleDuplicate(input: { title?: string | null; description: string }, existing: Array<Pick<Occurrence, 'id' | 'title' | 'description' | 'address'>>) {
    const needle = `${input.title ?? ''} ${input.description}`.toLowerCase();
    return existing.find((item) => {
      const haystack = `${item.title ?? ''} ${item.description} ${item.address}`.toLowerCase();
      const sharedTerms = needle.split(/\s+/).filter((term) => term.length > 3 && haystack.includes(term));
      return sharedTerms.length >= 3;
    }) ?? null;
  }

  suggestDepartment(input: { category?: Pick<Category, 'name'> | null; title?: string | null; description: string }, departments: Department[]) {
    const text = `${input.category?.name ?? ''} ${input.title ?? ''} ${input.description}`.toLowerCase();
    const byKeyword = departments.find((department) =>
      text.includes('buraco') && department.name.toLowerCase().includes('infra') ||
      text.includes('asfalto') && department.name.toLowerCase().includes('infra') ||
      text.includes('ilumina') && department.name.toLowerCase().includes('ilum') ||
      text.includes('lixo') && department.name.toLowerCase().includes('limpeza')
    );

    return byKeyword ?? departments[0] ?? null;
  }

  generateManagementSummary(occurrences: Array<Pick<Occurrence, 'status' | 'priority'>>) {
    const counts = occurrences.reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      acc[item.priority] = (acc[item.priority] ?? 0) + 1;
      return acc;
    }, { total: 0 } as Record<string, number>);

    return `Total: ${counts.total ?? 0} | Abertas: ${counts.ABERTO ?? 0} | Urgentes: ${counts.URGENTE ?? 0} | Altas: ${counts.ALTA ?? 0}`;
  }

  async calculateAndPersist(occurrenceId: string, occurrence: Pick<Occurrence, 'address' | 'createdAt' | 'priority'>) {
    const score = this.calculatePriority({
      title: undefined,
      description: occurrence.address,
      address: occurrence.address
    }).score;
    const classification = score > 100 ? 'CRITICA' : score >= 81 ? 'URGENTE' : score >= 61 ? 'ALTA' : score >= 31 ? 'MEDIA' : 'BAIXA';
    return this.prisma.priorityCalculation.upsert({
      where: { occurrenceId },
      create: { occurrenceId, score, classification, detailsJson: { source: 'rules' } },
      update: { score, classification, detailsJson: { source: 'rules' } }
    });
  }
}
