import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { Controller, Post, Body } from '@nestjs/common';
import { ConversationService } from './conversation.service';

@ApiTags('Conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  createConversation(@Body() body: CreateConversationDto) {
    return this.conversationService.createConversation(body.userIds);
  }
}
