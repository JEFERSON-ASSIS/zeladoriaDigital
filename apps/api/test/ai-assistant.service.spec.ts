import { AiAssistantService, MockIAProvider } from '../src/modules/ai-assistant/ai-assistant.service';

describe('AiAssistantService', () => {
  it('suggests category and priority', async () => {
    const service = new AiAssistantService(new MockIAProvider());

    await expect(service.suggestCategory({ description: 'entulho na rua' })).resolves.toBe('Limpeza urbana');
    await expect(service.suggestPriority({ description: 'risco perto de escola' })).resolves.toBe('URGENTE');
  });
});
