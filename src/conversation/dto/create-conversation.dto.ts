import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    example: ['8dd7a88d-a09f-4e0d-9d81-3090d0c4c479', 'another-user-id'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  userIds!: string[];
}
