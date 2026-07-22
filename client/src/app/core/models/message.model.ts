import { User } from './user.model';

export interface Message {
  _id: string;
  conversation: string;
  sender: User | string;
  text: string;
  read: boolean;
  createdAt: string;
}
