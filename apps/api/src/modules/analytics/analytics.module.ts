import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PriorityModule } from '../priority/priority.module';
import { AiAssistantModule } from '../ai-assistant/ai-assistant.module';

@Module({
  imports: [PriorityModule, AiAssistantModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService]
})
export class AnalyticsModule {}
