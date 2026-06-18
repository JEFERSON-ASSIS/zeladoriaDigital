import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PushLogsModule } from '../push-logs/push-logs.module';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [PrismaModule, PushLogsModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService]
})
export class AnnouncementsModule {}
