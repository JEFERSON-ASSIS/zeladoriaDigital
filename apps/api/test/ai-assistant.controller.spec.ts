import { AiAssistantController } from '../src/modules/ai-assistant/ai-assistant.controller';

describe('AiAssistantController', () => {
  const service = {
    suggestCategory: jest.fn().mockResolvedValue('Infraestrutura'),
    suggestPriority: jest.fn().mockResolvedValue('ALTA'),
    detectDuplicate: jest.fn().mockResolvedValue(false),
    generateExecutiveSummary: jest.fn().mockResolvedValue({ summary: 'Resumo' })
  };

  const controller = new AiAssistantController(service as any);

  it('forwards ai requests to service', async () => {
    await controller.suggestCategory({ description: 'buraco' });
    await controller.suggestPriority({ description: 'risco' });
    await controller.detectDuplicate({ description: 'buraco' });
    await controller.executiveSummary({ periodStart: '2026-06-01' });

    expect(service.suggestCategory).toHaveBeenCalledWith({ description: 'buraco' });
    expect(service.suggestPriority).toHaveBeenCalledWith({ description: 'risco' });
    expect(service.detectDuplicate).toHaveBeenCalledWith({ description: 'buraco' });
    expect(service.generateExecutiveSummary).toHaveBeenCalledWith({ periodStart: '2026-06-01' });
  });
});
