import { Module } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';
import { PriorityModule } from '../priority/priority.module';
import { ServiceAreaModule } from '../service-area/service-area.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [PriorityModule, ServiceAreaModule, WhatsAppModule, PrismaModule, AccessModule],
  providers: [OccurrencesService],
  controllers: [OccurrencesController]
})
export class OccurrencesModule {}
