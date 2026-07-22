import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { Conversation } from '../../../core/models/conversation.model';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page animate-fade-in">
      <div class="header-section">
        <h2>Messages</h2>
      </div>

      <div *ngIf="isLoading" class="loading-center">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!isLoading && conversations.length === 0" class="empty-state glass">
        <div class="text-center p-8">
          <div class="icon-wrap mx-auto mb-4">💬</div>
          <h3>No Conversations Yet</h3>
          <p class="text-muted mt-2">Find nearby players and send them a play request to start chatting.</p>
          <a routerLink="/dashboard" class="btn btn-primary mt-4">Find Players</a>
        </div>
      </div>

      <div class="conv-list mt-4" *ngIf="!isLoading && conversations.length > 0">
        <a *ngFor="let conv of conversations" [routerLink]="['/chat', conv._id]" class="conv-item glass">
          <div class="avatar-wrap">
            <div class="avatar md">
              <img *ngIf="getOtherUser(conv).avatar; else noAvatar" [src]="getAvatarUrl(getOtherUser(conv))" alt="Avatar" />
              <ng-template #noAvatar>{{ getOtherUser(conv).name.charAt(0).toUpperCase() }}</ng-template>
            </div>
            <div class="status-indicator" [class.online]="getOtherUser(conv).isOnline"></div>
          </div>
          
          <div class="conv-info">
            <div class="flex justify-between items-center mb-1">
              <span class="name font-bold">{{ getOtherUser(conv).name }}</span>
              <span class="time text-xs text-muted" *ngIf="conv.lastMessage">{{ conv.lastMessageAt | date:'shortTime' }}</span>
            </div>
            <div class="last-msg text-sm text-muted truncate">
              <ng-container *ngIf="conv.lastMessage">
                <span *ngIf="conv.lastMessage.sender === auth.currentUser()?._id">You: </span>
                {{ conv.lastMessage.text }}
              </ng-container>
              <span *ngIf="!conv.lastMessage" class="italic">No messages yet. Say hi!</span>
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
    .header-section { margin-bottom: 24px; }
    .empty-state { padding: 48px 24px; border-radius: var(--radius-lg); }
    .icon-wrap { font-size: 3rem; background: rgba(255,255,255,0.05); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .text-center { text-align: center; }
    .p-8 { padding: 32px; }
    .conv-list { display: flex; flex-direction: column; gap: 12px; }
    .conv-item { display: flex; align-items: center; gap: 16px; padding: 16px 20px; transition: var(--transition); text-decoration: none; color: inherit; }
    .conv-item:hover { transform: translateX(4px); border-color: var(--color-primary-dim); background: rgba(255,255,255,0.06); }
    .avatar-wrap { position: relative; }
    .status-indicator { position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--color-text-dim); border: 2px solid var(--color-surface); }
    .status-indicator.online { background: var(--color-success); box-shadow: 0 0 6px var(--color-success); }
    .conv-info { flex: 1; min-width: 0; }
    .last-msg { margin-top: 2px; }
    .italic { font-style: italic; }
  `]
})
export class ConversationListComponent implements OnInit {
  conversations: Conversation[] = [];
  isLoading = true;

  constructor(private chatService: ChatService, public auth: AuthService) {}

  ngOnInit() {
    this.chatService.getConversations().subscribe({
      next: (res) => {
        this.conversations = res.conversations;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getOtherUser(conv: Conversation): User {
    const me = this.auth.currentUser()?._id;
    return conv.participants.find(p => p._id !== me) as User;
  }
  
  getAvatarUrl(user: User) {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${user.avatar}`;
  }
}
