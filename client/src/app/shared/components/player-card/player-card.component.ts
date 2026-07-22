import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User } from '../../../core/models/user.model';
import { SportBadgeComponent } from '../sport-badge/sport-badge.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [CommonModule, RouterModule, SportBadgeComponent],
  template: `
    <div class="player-card glass">
      <div class="card-header">
        <div class="avatar-wrap">
          <div class="avatar lg">
            <img *ngIf="player.avatar; else noAvatar" [src]="getAvatarUrl()" alt="Avatar" />
            <ng-template #noAvatar>{{ player.name.charAt(0).toUpperCase() }}</ng-template>
          </div>
          <div class="status-indicator" [class.online]="player.isOnline" [title]="player.isOnline ? 'Online' : 'Offline'"></div>
        </div>
        
        <div class="user-info">
          <h3 class="name">
            <a [routerLink]="['/profile', player._id]">{{ player.name }}</a>
          </h3>
          <p class="meta text-xs text-muted">
            <span *ngIf="player.age">{{ player.age }} years • </span>
            <span>{{ player.skillLevel }}</span>
          </p>
          <div class="distance text-xs font-bold text-primary mt-2" *ngIf="player.distance !== undefined">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; display: inline; vertical-align: -2px;">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ formatDistance(player.distance) }} away
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <p class="bio text-sm text-muted" *ngIf="player.bio">{{ player.bio }}</p>
        
        <div class="sports-list mt-4">
          <app-sport-badge *ngFor="let s of player.sports.slice(0, 3)" [sport]="s"></app-sport-badge>
          <span class="badge badge-accent" *ngIf="player.sports.length > 3">+{{ player.sports.length - 3 }}</span>
        </div>
      </div>
      
      <div class="card-footer" *ngIf="showActions">
        <div class="divider" style="margin: 12px 0;"></div>
        <button class="btn btn-primary w-full btn-sm" (click)="onAction.emit(player)">
          {{ actionText }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .player-card { padding: 20px; display: flex; flex-direction: column; height: 100%; transition: var(--transition); }
    .player-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: rgba(255,255,255,0.15); }
    .card-header { display: flex; gap: 16px; align-items: center; }
    .avatar-wrap { position: relative; }
    .status-indicator { position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--color-text-dim); border: 2.5px solid var(--color-surface); }
    .status-indicator.online { background: var(--color-success); box-shadow: 0 0 8px var(--color-success); animation: pulse-online 2s infinite; }
    .user-info { flex: 1; min-width: 0; }
    .name { font-size: 1.15rem; margin-bottom: 2px; }
    .name a { color: var(--color-text); text-decoration: none; transition: var(--transition); }
    .name a:hover { color: var(--color-primary); }
    .text-primary { color: var(--color-primary); }
    .card-body { margin-top: 16px; flex: 1; }
    .bio { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sports-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .card-footer { margin-top: auto; }
  `]
})
export class PlayerCardComponent {
  @Input({ required: true }) player!: User;
  @Input() showActions = false;
  @Input() actionText = 'Action';
  @Output() onAction = new EventEmitter<User>();

  getAvatarUrl() {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${this.player.avatar}`;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
