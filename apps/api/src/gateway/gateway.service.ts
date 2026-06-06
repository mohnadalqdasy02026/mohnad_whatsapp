import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
})
export class GatewayService implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GatewayService.name);
  @WebSocketServer() server: Server;

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token as string);
      (client.data as any).user = payload;
      const room = `company:${payload.companyId}`;
      await client.join(room);
      // also join a user-specific room for DMs
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Socket ${client.id} joined ${room} (user=${payload.sub})`);
    } catch (e: any) {
      this.logger.warn(`Socket auth failed: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket ${client.id} disconnected`);
  }

  // join a specific conversation room
  @SubscribeMessage('conversation:join')
  async joinConversation(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    if (!body?.conversationId) return;
    await client.join(`conversation:${body.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    if (!body?.conversationId) return;
    await client.leave(`conversation:${body.conversationId}`);
  }

  // typing indicator
  @SubscribeMessage('typing')
  typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string; isTyping: boolean },
  ) {
    const user = (client.data as any).user as JwtPayload;
    if (!user || !body?.conversationId) return;
    this.server.to(`conversation:${body.conversationId}`).emit('typing', {
      userId: user.sub,
      conversationId: body.conversationId,
      isTyping: !!body.isTyping,
    });
  }

  // ---- helpers used by services ----
  emitToCompany(companyId: string, event: string, payload: any) {
    this.server?.to(`company:${companyId}`).emit(event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: any) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload);
  }
}
