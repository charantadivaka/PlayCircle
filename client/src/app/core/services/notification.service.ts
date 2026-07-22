import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'request' | 'message' | 'accepted' | 'declined';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  notifications = signal<AppNotification[]>([]);
  unreadCount = signal<number>(0);

  add(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    this.notifications.update((n) => [newNotif, ...n].slice(0, 50));
    this.unreadCount.update((c) => c + 1);
  }

  markAllRead() {
    this.notifications.update((n) => n.map((item) => ({ ...item, read: true })));
    this.unreadCount.set(0);
  }

  clear() {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
