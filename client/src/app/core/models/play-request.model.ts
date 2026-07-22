import { User } from './user.model';

export interface PlayRequest {
  _id: string;
  from: User;
  to: User;
  sport: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
