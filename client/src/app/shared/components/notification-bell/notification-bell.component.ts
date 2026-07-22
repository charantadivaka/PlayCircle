import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell-container" (click)="toggleDropdown()">
      <div class="bell-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <div class="badge-count" *ngIf="notificationService.unreadCount() > 0">
        {{ notificationService.unreadCount() }}
      </div>
      
      <div class="dropdown glass" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <span class="font-bold">Notifications</span>
          <button class="btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.75rem;" (click)="markAllRead()">Mark read</button>
        </div>
        <div class="divider"></div>
        
        <div class="notif-list">
          <div *ngIf="notificationService.notifications().length === 0" class="empty-state">
            No new notifications
          </div>
          <div class="notif-item" *ngFor="let n of notificationService.notifications()" [class.unread]="!n.read" (click)="handleNotifClick(n)">
            <div class="notif-content">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-body text-xs text-muted mt-2">{{ n.body }}</div>
            </div>
            <div class="notif-dot" *ngIf="!n.read"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bell-container { position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; transition: var(--transition); }
    .bell-container:hover { background: rgba(255,255,255,0.05); color: var(--color-primary); }
    .bell-icon { color: var(--color-text-muted); transition: var(--transition); }
    .bell-container:hover .bell-icon { color: var(--color-text); }
    .badge-count { position: absolute; top: -2px; right: -2px; background: var(--color-danger); color: white; font-size: 0.65rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px var(--color-danger-dim); }
    .dropdown { position: absolute; top: calc(100% + 10px); right: -60px; width: 320px; padding: 12px 0; display: flex; flex-direction: column; animation: fadeIn 0.2s ease; cursor: default; }
    .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 0 16px; }
    .notif-list { max-height: 350px; overflow-y: auto; }
    .empty-state { padding: 24px 16px; text-align: center; color: var(--color-text-dim); font-size: 0.9rem; }
    .notif-item { padding: 12px 16px; display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; transition: var(--transition); border-left: 2px solid transparent; }
    .notif-item:hover { background: rgba(255,255,255,0.03); }
    .notif-item.unread { background: rgba(255,255,255,0.02); border-left-color: var(--color-primary); }
    .notif-title { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .notif-dot { width: 8px; height: 8px; background: var(--color-primary); border-radius: 50%; box-shadow: 0 0 6px var(--color-primary-glow); margin-top: 4px; }
  `]
})
export class NotificationBellComponent {
  isOpen = false;

  constructor(public notificationService: NotificationService, private router: Router) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  markAllRead() {
    this.notificationService.markAllRead();
  }

  handleNotifClick(n: any) {
    if (!n.read) {
      n.read = true;
      this.notificationService.unreadCount.update(c => Math.max(0, c - 1));
    }
    
    if (n.type === 'request' || n.type === 'accepted') {
      this.router.navigate(['/requests']);
      this.isOpen = false;
    } else if (n.type === 'message' && n.data?.conversation) {
      this.router.navigate(['/chat', n.data.conversation]);
      this.isOpen = false;
    }
  }
}
