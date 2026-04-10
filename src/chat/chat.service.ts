import { Injectable } from '@nestjs/common';

type User = {
  username: string;
  room: string;
};

@Injectable()
export class ChatService {
  private users = new Map<string, User>();

  addUser(socketId: string, username: string, room: string) {
    const user: User = { username, room };
    this.users.set(socketId, user);
    return user;
  }

  removeUser(socketId: string) {
    return this.users.delete(socketId);
  }

  getUser(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  createMessage(username: string, message: string) {
    return {
      user: username,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
