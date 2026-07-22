import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sport-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="sport-badge" [ngClass]="colorClass">
      <span class="icon">{{ getIcon() }}</span>
      {{ sport }}
    </span>
  `,
  styles: [`
    .sport-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: var(--radius-full);
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
      white-space: nowrap; border: 1px solid transparent;
    }
    .icon { font-size: 0.85rem; }
    
    /* Sport Colors */
    .c-cricket { background: rgba(0, 200, 83, 0.15); color: #00e676; border-color: rgba(0,230,118,0.3); }
    .c-football { background: rgba(41, 121, 255, 0.15); color: #448aff; border-color: rgba(68,138,255,0.3); }
    .c-basketball { background: rgba(255, 145, 0, 0.15); color: #ffab40; border-color: rgba(255,171,64,0.3); }
    .c-tennis { background: rgba(174, 234, 0, 0.15); color: #c6ff00; border-color: rgba(198,255,0,0.3); }
    .c-badminton { background: rgba(213, 0, 249, 0.15); color: #e040fb; border-color: rgba(224,64,251,0.3); }
    .c-volleyball { background: rgba(0, 176, 255, 0.15); color: #40c4ff; border-color: rgba(64,196,255,0.3); }
    .c-default { background: var(--color-surface-2); color: var(--color-text); border-color: var(--color-border); }
  `]
})
export class SportBadgeComponent {
  @Input({ required: true }) sport!: string;

  getIcon(): string {
    const icons: Record<string, string> = {
      'Cricket': '🏏',
      'Football': '⚽',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Badminton': '🏸',
      'Volleyball': '🏐',
      'Table Tennis': '🏓',
      'Chess': '♟️',
      'Running': '🏃',
      'Cycling': '🚴'
    };
    return icons[this.sport] || '🏅';
  }

  get colorClass(): string {
    const normalized = this.sport.toLowerCase().replace(' ', '');
    const valid = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball'];
    return valid.includes(normalized) ? `c-${normalized}` : 'c-default';
  }
}
