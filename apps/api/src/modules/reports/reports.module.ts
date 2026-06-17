import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
