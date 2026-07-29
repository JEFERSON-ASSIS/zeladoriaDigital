import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SupportChatController } from './support-chat.controller';
import { SupportChatGateway } from './support-chat.gateway';
import { SupportChatService } from './support-chat.service';
import { WebPushModule } from '../web-push/web-push.module';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-this-in-production' }),
    WebPushModule
  ],
  controllers: [SupportChatController],
  providers: [SupportChatService, SupportChatGateway]
})
export class SupportChatModule {}
