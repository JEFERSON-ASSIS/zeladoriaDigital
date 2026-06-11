import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PriorityModule } from '../priority/priority.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AnalyticsModule, PriorityModule],
  providers: [JobsService]
})
export class JobsModule {}
