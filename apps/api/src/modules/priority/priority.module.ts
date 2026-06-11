import { Module } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PriorityEngineService } from './priority-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [PriorityService, PriorityEngineService],
  exports: [PriorityService, PriorityEngineService]
})
export class PriorityModule {}
