import { User } from './user.model';
import { Message } from './message.model';

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt: string;
  createdAt: string;
}
