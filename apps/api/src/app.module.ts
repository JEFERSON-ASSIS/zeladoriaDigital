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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CitizensModule,
    OccurrencesModule,
    DepartmentsModule,
    CategoriesModule,
    NeighborhoodsModule,
    WhatsAppModule,
    PriorityModule
  ]
})
export class AppModule {}
