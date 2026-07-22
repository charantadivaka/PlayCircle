import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  template: `
    <nav class="navbar glass">
      <div class="nav-container">
        <a routerLink="/dashboard" class="brand">
          <div class="logo-circle"></div>
          PlayCircle
        </a>

        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">Map</a>
          <a routerLink="/chat" routerLinkActive="active" class="nav-link">Chat</a>
          <a routerLink="/requests" routerLinkActive="active" class="nav-link">Requests</a>
          <app-notification-bell></app-notification-bell>
          
          <div class="profile-menu" (click)="toggleMenu()">
            <div class="avatar sm">
              <img *ngIf="userAvatar; else noAvatar" [src]="userAvatar" alt="Avatar" />
              <ng-template #noAvatar>{{ userInitials }}</ng-template>
            </div>
            
            <div class="dropdown glass" *ngIf="menuOpen">
              <div class="dropdown-header">
                <span class="font-bold">{{ auth.currentUser()?.name }}</span>
                <span class="text-xs text-muted">{{ auth.currentUser()?.email }}</span>
              </div>
              <div class="divider"></div>
              <a routerLink="/profile" class="dropdown-item">My Profile</a>
              <button (click)="logout()" class="dropdown-item text-danger">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 64px;
      z-index: 1000;
      border-radius: 0;
      border-top: none; border-left: none; border-right: none;
    }
    .nav-container {
      max-width: 1200px; margin: 0 auto; padding: 0 20px;
      height: 100%; display: flex; align-items: center; justify-content: space-between;
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.25rem; font-weight: 800; color: var(--color-text);
      letter-spacing: -0.03em;
    }
    .logo-circle {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      box-shadow: 0 0 12px var(--color-primary-glow);
    }
    .nav-links {
      display: flex; align-items: center; gap: 24px;
    }
    .nav-link {
      font-weight: 500; color: var(--color-text-muted);
      transition: var(--transition);
      font-size: 0.95rem;
    }
    .nav-link:hover, .nav-link.active {
      color: var(--color-primary);
      text-decoration: none;
    }
    .profile-menu {
      position: relative; cursor: pointer; margin-left: 12px;
    }
    .dropdown {
      position: absolute; top: calc(100% + 10px); right: 0;
      min-width: 200px; padding: 8px 0;
      display: flex; flex-direction: column;
      animation: fadeIn 0.2s ease;
    }
    .dropdown-header {
      padding: 8px 16px; display: flex; flex-direction: column;
    }
    .dropdown .divider { margin: 8px 0; }
    .dropdown-item {
      padding: 10px 16px; text-align: left; background: none; border: none;
      color: var(--color-text); cursor: pointer; font-family: 'Inter', sans-serif;
      font-size: 0.9rem; transition: var(--transition); text-decoration: none; display: block;
    }
    .dropdown-item:hover { background: rgba(255,255,255,0.05); }
    .text-danger { color: var(--color-danger); }
  `]
})
export class NavbarComponent {
  menuOpen = false;

  constructor(public auth: AuthService) {}

  get userAvatar() {
    const avatar = this.auth.currentUser()?.avatar;
    return avatar ? `${environment.apiUrl.replace('/api', '')}/uploads/${avatar}` : null;
  }

  get userInitials() {
    const name = this.auth.currentUser()?.name || '?';
    return name.charAt(0).toUpperCase();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.auth.logout();
  }
}
