import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { Message } from '../../../core/models/message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header glass">
        <a routerLink="/chat" class="back-btn mr-4">←</a>
        <div class="header-info" *ngIf="!isLoading">
          <h3>Chat</h3>
        </div>
      </div>

      <div class="chat-messages" #messagesContainer>
        <div *ngIf="isLoading" class="loading-center">
          <div class="spinner"></div>
        </div>
        
        <div *ngIf="!isLoading && messages.length === 0" class="empty-chat">
          <p class="text-muted text-center">No messages yet. Send a message to start chatting!</p>
        </div>

        <div *ngFor="let msg of messages; let i = index" 
             class="message-wrapper" 
             [class.own-message]="isOwnMessage(msg)">
          <div class="message-bubble" [class.own]="isOwnMessage(msg)">
            <div class="text">{{ msg.text }}</div>
            <div class="time text-xs">{{ msg.createdAt | date:'shortTime' }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input-area glass">
        <form (ngSubmit)="sendMessage()" class="flex gap-2">
          <input 
            type="text" 
            [(ngModel)]="newMessage" 
            name="newMessage" 
            placeholder="Type a message..." 
            class="form-control"
            autocomplete="off"
            [disabled]="isSending"
          />
          <button type="submit" class="btn btn-primary" [disabled]="!newMessage.trim() || isSending">
            <span *ngIf="isSending" class="spinner-small"></span>
            <span *ngIf="!isSending">Send</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: calc(100vh - 64px); max-width: 900px; margin: 0 auto; background: var(--color-surface); border-left: 1px solid var(--color-border); border-right: 1px solid var(--color-border); }
    .chat-header { padding: 16px 24px; display: flex; align-items: center; border-radius: 0; border-top: none; border-left: none; border-right: none; z-index: 10; }
    .back-btn { background: rgba(255,255,255,0.05); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; color: var(--color-text); transition: var(--transition); font-weight: bold; }
    .back-btn:hover { background: rgba(255,255,255,0.1); }
    .mr-4 { margin-right: 16px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; scroll-behavior: smooth; }
    .empty-chat { flex: 1; display: flex; align-items: center; justify-content: center; }
    .message-wrapper { display: flex; flex-direction: column; align-items: flex-start; max-width: 80%; }
    .message-wrapper.own-message { align-self: flex-end; align-items: flex-end; }
    .message-bubble { padding: 12px 16px; border-radius: 18px; border-bottom-left-radius: 4px; background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text); position: relative; }
    .message-bubble.own { border-bottom-left-radius: 18px; border-bottom-right-radius: 4px; background: var(--color-primary-dim); border-color: rgba(0,201,167,0.3); color: var(--color-text); }
    .time { margin-top: 4px; opacity: 0.7; text-align: right; }
    .chat-input-area { padding: 16px 24px; border-radius: 0; border-bottom: none; border-left: none; border-right: none; }
    .form-control { flex: 1; }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  conversationId = '';
  messages: Message[] = [];
  isLoading = true;
  newMessage = '';
  isSending = false;
  
  private subs: Subscription[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private socketService: SocketService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('convId');
      if (id) {
        this.conversationId = id;
        this.fetchMessages();
      }
    });

    // Listen for incoming messages in real-time
    this.subs.push(
      this.socketService.message$.subscribe(({ message, conversationId }) => {
        if (conversationId === this.conversationId) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      })
    );
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }

  fetchMessages() {
    this.isLoading = true;
    this.chatService.getMessages(this.conversationId).subscribe({
      next: (res) => {
        this.messages = res.messages;
        this.isLoading = false;
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  isOwnMessage(msg: Message): boolean {
    const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    return senderId === this.auth.currentUser()?._id;
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.isSending) return;
    
    this.isSending = true;
    const text = this.newMessage.trim();
    
    try {
      // Send via Socket.IO
      const res = await this.socketService.sendMessage(this.conversationId, text);
      this.messages.push(res.message);
      this.newMessage = '';
      this.shouldScrollToBottom = true;
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      this.isSending = false;
    }
  }
}
