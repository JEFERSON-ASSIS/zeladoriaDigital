import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PriorityModule } from '../priority/priority.module';
import { ReportsModule } from '../reports/reports.module';
import { ExportModule } from '../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AnalyticsModule, PriorityModule, ReportsModule, ExportModule],
  providers: [JobsService]
})
export class JobsModule {}
