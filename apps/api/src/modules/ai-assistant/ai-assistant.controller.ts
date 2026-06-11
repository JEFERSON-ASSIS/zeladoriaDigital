import { Body, Controller, Post } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';

@Controller('admin/ai')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('suggest-category')
  suggestCategory(@Body() body: { title?: string; description: string }) {
    return this.aiAssistantService.suggestCategory(body);
  }

  @Post('suggest-priority')
  suggestPriority(@Body() body: { title?: string; description: string }) {
    return this.aiAssistantService.suggestPriority(body);
  }

  @Post('detect-duplicate')
  detectDuplicate(@Body() body: { title?: string; description: string }) {
    return this.aiAssistantService.detectDuplicate(body);
  }

  @Post('executive-summary')
  executiveSummary(@Body() body: { periodStart?: string; periodEnd?: string }) {
    return this.aiAssistantService.generateExecutiveSummary(body);
  }
}
