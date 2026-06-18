import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PushLogsModule } from '../push-logs/push-logs.module';
import { SchedulingRemindersController } from './scheduling-reminders.controller';
import { SchedulingRemindersService } from './scheduling-reminders.service';

@Module({
  imports: [PrismaModule, PushLogsModule],
  controllers: [SchedulingRemindersController],
  providers: [SchedulingRemindersService]
})
export class SchedulingRemindersModule {}
