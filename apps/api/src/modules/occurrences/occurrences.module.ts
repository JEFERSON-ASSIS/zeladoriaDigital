import { Module } from '@nestjs/common';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesController } from './occurrences.controller';
import { PriorityModule } from '../priority/priority.module';

@Module({
  imports: [PriorityModule],
  providers: [OccurrencesService],
  controllers: [OccurrencesController]
})
export class OccurrencesModule {}
