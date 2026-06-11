import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService, MockIAProvider } from './ai-assistant.service';

@Module({
  controllers: [AiAssistantController],
  providers: [AiAssistantService, MockIAProvider]
})
export class AiAssistantModule {}
