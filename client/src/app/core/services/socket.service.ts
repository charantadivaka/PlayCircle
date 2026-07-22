import { Injectable, OnDestroy, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message } from '../models/message.model';
import { PlayRequest } from '../models/play-request.model';
import { Conversation } from '../models/conversation.model';

export interface TypingEvent {
  conversationId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  // Observable streams for components to subscribe to
  message$ = new Subject<{ message: Message; conversationId: string }>();
  playRequest$ = new Subject<{ playRequest: PlayRequest }>();
  requestResponse$ = new Subject<{ playRequest: PlayRequest; conversation: Conversation | null }>();
  userOnline$ = new Subject<{ userId: string }>();
  userOffline$ = new Subject<{ userId: string; lastSeen: string }>();
  typingStart$ = new Subject<TypingEvent>();
  typingStop$ = new Subject<TypingEvent>();

  isConnected = signal<boolean>(false);

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      this.isConnected.set(false);
    });

    this.socket.on('message:receive', (data) => this.message$.next(data));
    this.socket.on('request:new', (data) => this.playRequest$.next(data));
    this.socket.on('request:response', (data) => this.requestResponse$.next(data));
    this.socket.on('user:online', (data) => this.userOnline$.next(data));
    this.socket.on('user:offline', (data) => this.userOffline$.next(data));
    this.socket.on('typing:start', (data) => this.typingStart$.next(data));
    this.socket.on('typing:stop', (data) => this.typingStop$.next(data));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected.set(false);
  }

  sendMessage(conversationId: string, text: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket?.emit('message:send', { conversationId, text }, (ack: any) => {
        if (ack?.success) resolve(ack);
        else reject(ack?.error ?? 'Failed to send');
      });
    });
  }

  updateLocation(lng: number, lat: number) {
    this.socket?.emit('location:update', { lng, lat });
  }

  startTyping(conversationId: string, recipientId: string) {
    this.socket?.emit('typing:start', { conversationId, recipientId });
  }

  stopTyping(conversationId: string, recipientId: string) {
    this.socket?.emit('typing:stop', { conversationId, recipientId });
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
