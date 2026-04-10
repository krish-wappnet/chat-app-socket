import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { EVENTS } from '../core/constants/app.constant';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server!: Server;

  // ================= CONNECTION =================

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = this.chatService.getUser(client.id);

    if (user) {
      this.chatService.removeUser(client.id);

      this.server.to(user.room).emit(EVENTS.USER_LEFT, {
        user: user.username,
      });
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  // ================= JOIN ROOM =================

  @SubscribeMessage(EVENTS.JOIN)
  handleJoin(
    @MessageBody()
    data: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { username, room } = data;

    // validation
    if (!username || !room) {
      client.emit('error', { message: 'Username and room are required' });
      return;
    }

    // join socket.io room
    void client.join(room);

    // store user
    this.chatService.addUser(client.id, username, room);

    // notify room
    this.server.to(room).emit(EVENTS.USER_JOINED, {
      user: username,
    });
  }

  // ================= SEND MESSAGE =================

  @SubscribeMessage(EVENTS.MESSAGE)
  handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = this.chatService.getUser(client.id);

    if (!user) {
      client.emit('error', { message: 'User not joined' });
      return;
    }

    if (!data.message || data.message.trim() === '') {
      return;
    }

    const payload = this.chatService.createMessage(user.username, data.message);

    // emit only to user's room
    this.server.to(user.room).emit(EVENTS.MESSAGE, payload);
  }
}
