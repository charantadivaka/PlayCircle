import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getConversations() {
    return this.http.get<{ conversations: Conversation[] }>(`${this.API}/chat/conversations`);
  }

  getMessages(convId: string, page = 1) {
    return this.http.get<{ messages: Message[] }>(
      `${this.API}/chat/${convId}/messages`,
      { params: { page, limit: 50 } }
    );
  }
}
