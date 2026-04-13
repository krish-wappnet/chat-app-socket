import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Conversation } from '../chat/entities/conversation.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  // ================= SAVE MESSAGE =================
  async createMessage(content: string, user: User, conversation: Conversation) {
    const message = this.messageRepo.create({
      content,
      user,
      conversation,
    });

    return this.messageRepo.save(message);
  }

  // ================= GET MESSAGES =================
  async getRecentMessages(limit = 50) {
    return this.messageRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
