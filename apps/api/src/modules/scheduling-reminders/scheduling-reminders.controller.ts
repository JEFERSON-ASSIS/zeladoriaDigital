import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscribeSchedulingReminderDto } from './dto/subscribe.dto';
import { SchedulingRemindersService } from './scheduling-reminders.service';

@Controller('scheduling-reminders')
@UseGuards(JwtAuthGuard)
export class SchedulingRemindersController {
  constructor(private readonly service: SchedulingRemindersService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribeSchedulingReminderDto) {
    return this.service.subscribe(dto);
  }
}
