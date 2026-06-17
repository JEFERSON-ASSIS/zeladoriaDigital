import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CitizensModule } from './modules/citizens/citizens.module';
import { OccurrencesModule } from './modules/occurrences/occurrences.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { NeighborhoodsModule } from './modules/neighborhoods/neighborhoods.module';
import { PrismaModule } from './prisma/prisma.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { PriorityModule } from './modules/priority/priority.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportModule } from './modules/export/export.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { TransparencyModule } from './modules/transparency/transparency.module';
import { ServiceAreaModule } from './modules/service-area/service-area.module';
import { PushNotificationsModule } from './modules/push-notifications/push-notifications.module';
import { SchedulingRemindersModule } from './modules/scheduling-reminders/scheduling-reminders.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AccessModule } from './modules/access/access.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AccessModule,
    PermissionsModule,
    AuthModule,
    UsersModule,
    CitizensModule,
    OccurrencesModule,
    DepartmentsModule,
    CategoriesModule,
    NeighborhoodsModule,
    WhatsAppModule,
    PriorityModule,
    AnalyticsModule,
    AiAssistantModule,
    ReportsModule,
    ExportModule,
    JobsModule,
    TransparencyModule,
    ServiceAreaModule,
    PushNotificationsModule,
    SchedulingRemindersModule
  ]
})
export class AppModule {}
