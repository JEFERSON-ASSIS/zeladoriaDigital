import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupportChatController } from './support-chat.controller';
import { SupportChatGateway } from './support-chat.gateway';
import { SupportChatService } from './support-chat.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-this-in-production' })],
  controllers: [SupportChatController],
  providers: [SupportChatService, SupportChatGateway]
})
export class SupportChatModule {}
