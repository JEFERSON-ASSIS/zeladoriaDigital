import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRole } from '@prisma/client';
import { SupportChatService } from './support-chat.service';

@WebSocketGateway({ namespace: '/support-chat', cors: { origin: true, credentials: true } })
export class SupportChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly supportChat: SupportChatService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = String(client.handshake.auth?.token ?? '');
      const payload = await this.jwt.verifyAsync<{ sub: string; role: string }>(token);
      if (!['CIDADAO', 'ADMIN', 'PREFEITURA'].includes(payload.role)) {
        client.disconnect(true);
        return;
      }
      client.data.actor = payload;
      client.join(`actor:${payload.sub}`);
      if (payload.role !== 'CIDADAO') client.join('staff');
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() client: Socket, conversationId: string) {
    if (!conversationId || !client.data.actor) return;
    try {
      await this.supportChat.getConversation(conversationId, client.data.actor as { sub: string; role: UserRole });
      client.join(`conversation:${conversationId}`);
    } catch {
      client.emit('conversation:error', { message: 'Conversa não autorizada.' });
    }
  }

  emitMessage(conversationId: string, message: unknown) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', message);
    this.server.to('staff').emit('conversation:updated', { conversationId });
  }
}
