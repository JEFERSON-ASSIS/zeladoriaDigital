import { Injectable } from '@nestjs/common';

export interface IAProvider {
  suggestCategory(input: { title?: string; description: string }): Promise<string>;
  suggestDepartment(input: { title?: string; description: string }): Promise<string>;
  suggestPriority(input: { title?: string; description: string }): Promise<string>;
  detectDuplicate(input: { title?: string; description: string }): Promise<boolean>;
  generateExecutiveSummary(input: { periodStart?: string; periodEnd?: string }): Promise<Record<string, unknown>>;
  analyzeNeighborhoodPatterns(input: { neighborhoodId?: string }): Promise<Record<string, unknown>>;
  predictDemandGrowth(input: { neighborhoodId?: string }): Promise<Record<string, unknown>>;
  suggestActionPlan(input: { departmentId?: string }): Promise<string[]>;
}

@Injectable()
export class MockIAProvider implements IAProvider {
  async suggestCategory(input: { title?: string; description: string }) { return /lixo|entulho/i.test(`${input.title ?? ''} ${input.description}`) ? 'Limpeza urbana' : 'Infraestrutura'; }
  async suggestDepartment(input: { title?: string; description: string }) { return /ilumina/i.test(`${input.title ?? ''} ${input.description}`) ? 'Iluminação pública' : 'Obras'; }
  async suggestPriority(input: { title?: string; description: string }) { return /risco|urgente|hospital|escola/i.test(`${input.title ?? ''} ${input.description}`) ? 'URGENTE' : 'MEDIA'; }
  async detectDuplicate(_input: { title?: string; description: string }) { return false; }
  async generateExecutiveSummary(_input: { periodStart?: string; periodEnd?: string }) { return { summary: 'Resumo mockado para apoio gerencial.' }; }
  async analyzeNeighborhoodPatterns(_input: { neighborhoodId?: string }) { return { pattern: 'Sem padrão crítico detectado.' }; }
  async predictDemandGrowth(_input: { neighborhoodId?: string }) { return { forecast: 'Estável' }; }
  async suggestActionPlan(_input: { departmentId?: string }) { return ['Priorizar ocorrências críticas', 'Monitorar SLA']; }
}

@Injectable()
export class AiAssistantService {
  constructor(private readonly provider: MockIAProvider) {}

  suggestCategory(input: { title?: string; description: string }) { return this.provider.suggestCategory(input); }
  suggestDepartment(input: { title?: string; description: string }) { return this.provider.suggestDepartment(input); }
  suggestPriority(input: { title?: string; description: string }) { return this.provider.suggestPriority(input); }
  detectDuplicate(input: { title?: string; description: string }) { return this.provider.detectDuplicate(input); }
  generateExecutiveSummary(input: { periodStart?: string; periodEnd?: string }) { return this.provider.generateExecutiveSummary(input); }
  analyzeNeighborhoodPatterns(input: { neighborhoodId?: string }) { return this.provider.analyzeNeighborhoodPatterns(input); }
  predictDemandGrowth(input: { neighborhoodId?: string }) { return this.provider.predictDemandGrowth(input); }
  suggestActionPlan(input: { departmentId?: string }) { return this.provider.suggestActionPlan(input); }
}
