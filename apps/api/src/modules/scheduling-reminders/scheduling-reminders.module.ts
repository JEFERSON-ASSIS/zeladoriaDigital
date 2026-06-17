import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SchedulingRemindersController } from './scheduling-reminders.controller';
import { SchedulingRemindersService } from './scheduling-reminders.service';

@Module({
  imports: [PrismaModule],
  controllers: [SchedulingRemindersController],
  providers: [SchedulingRemindersService]
})
export class SchedulingRemindersModule {}
