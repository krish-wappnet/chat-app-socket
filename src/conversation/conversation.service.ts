import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from '../chat/entities/conversation.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createConversation(userIds: string[]) {
    const users = await this.userRepo.findBy({
      id: In(userIds),
    });

    console.log('Usersssss:', users);

    if (users.length !== userIds.length) {
      throw new Error('Some users not found');
    }

    const conversation = this.conversationRepo.create({
      participants: users,
    });

    return this.conversationRepo.save(conversation);
  }
}
