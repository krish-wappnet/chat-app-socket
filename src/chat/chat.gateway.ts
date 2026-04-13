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
import { User } from '../auth/entities/user.entity';
import { MessageService } from '../message/message.service';
import { Conversation } from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// ================= TYPES =================

interface SocketWithUser extends Socket {
  data: {
    user: User;
  };
}

type JwtPayload = {
  sub: string;
  username: string;
};

// ================= GATEWAY =================

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
    private readonly messageService: MessageService,

    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
  ) {}

  @WebSocketServer()
  server!: Server;

  // ================= CONNECTION =================

  async handleConnection(client: SocketWithUser) {
    try {
      const token = client.handshake.auth?.token as string;

      if (!token) {
        throw new Error('No token provided');
      }

      const decoded = this.jwtService.verify<JwtPayload>(token);

      const user = await this.authService.validateUserById(decoded.sub);

      if (!user) {
        throw new Error('User not found');
      }

      // attach authenticated user
      client.data.user = user;

      console.log(`Authenticated user: ${user.username}`);
    } catch (err) {
      console.error('Unauthorized socket connection', err);
      client.disconnect();
    }
  }

  // ================= DISCONNECT =================

  handleDisconnect(client: SocketWithUser) {
    const userSession = this.chatService.getUser(client.id);

    if (userSession) {
      this.chatService.removeUser(client.id);

      this.server.to(userSession.conversationId).emit(EVENTS.USER_LEFT, {
        user: userSession.username,
      });
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  // ================= JOIN ROOM =================

  @SubscribeMessage(EVENTS.JOIN)
  async handleJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: SocketWithUser,
  ) {
    console.log('Join event received:', data);

    const user = client.data.user;
    const { conversationId } = data;

    if (!user || !conversationId) {
      console.log('Invalid join request: missing user or conversationId', user);
      console.log(
        'Invalid join request: missing user or conversationId',
        conversationId,
      );
      client.emit('error', { message: 'Invalid request' });
      return;
    }

    // 🔴 STEP 1: fetch conversation with participants
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });

    if (!conversation) {
      client.emit('error', { message: 'Conversation not found' });
      return;
    }

    // 🔴 STEP 2: check if user belongs to this conversation
    const isParticipant = conversation.participants.some(
      (participant) => participant.id === user.id,
    );

    if (!isParticipant) {
      client.emit('error', { message: 'Access denied' });
      return;
    }

    // ✅ STEP 3: now allow join
    client.join(conversationId);

    this.chatService.addUser(client.id, user.username, conversationId);

    this.server.to(conversationId).emit(EVENTS.USER_JOINED, {
      user: user.username,
    });
  }

  // ================= SEND MESSAGE =================

  @SubscribeMessage(EVENTS.MESSAGE)
  async handleMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() client: SocketWithUser,
  ) {
    const user = client.data.user;

    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    if (!data.message || data.message.trim() === '') {
      return;
    }

    const session = this.chatService.getUser(client.id);

    if (!session) {
      client.emit('error', { message: 'User not in conversation' });
      return;
    }

    // 🔴 IMPORTANT: fetch conversation
    const conversation = await this.conversationRepo.findOne({
      where: { id: session.conversationId },
    });

    if (!conversation) {
      client.emit('error', { message: 'Conversation not found' });
      return;
    }

    const savedMessage = await this.messageService.createMessage(
      data.message,
      user,
      conversation,
    );

    this.server.to(session.conversationId).emit(EVENTS.MESSAGE, {
      user: user.username,
      message: savedMessage.content,
      timestamp: savedMessage.createdAt,
    });
  }
}
