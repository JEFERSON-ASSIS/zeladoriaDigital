import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [AccessModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
