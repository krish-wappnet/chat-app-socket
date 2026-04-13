import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { Conversation } from './entities/conversation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [
    AuthModule,
    MessageModule,
    TypeOrmModule.forFeature([Conversation]),
  ],
})
export class ChatModule {}
