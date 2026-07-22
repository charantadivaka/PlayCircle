import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RequestService } from '../../core/services/request.service';
import { PlayRequest } from '../../core/models/play-request.model';
import { environment } from '../../../environments/environment';
import { SportBadgeComponent } from '../../shared/components/sport-badge/sport-badge.component';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, SportBadgeComponent],
  template: `
    <div class="page animate-fade-in">
      <div class="header-section">
        <h2>Play Requests</h2>
      </div>

      <div class="tabs mt-4">
        <button class="tab-btn" [class.active]="activeTab === 'incoming'" (click)="activeTab = 'incoming'">
          Incoming <span class="badge badge-accent" *ngIf="pendingIncomingCount > 0">{{ pendingIncomingCount }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'outgoing'" (click)="activeTab = 'outgoing'">
          Outgoing
        </button>
      </div>

      <div *ngIf="isLoading" class="loading-center">
        <div class="spinner"></div>
      </div>

      <div class="requests-container mt-6" *ngIf="!isLoading">
        
        <!-- INCOMING REQUESTS -->
        <ng-container *ngIf="activeTab === 'incoming'">
          <div *ngIf="incoming.length === 0" class="empty-state glass">
            <p class="text-muted text-center p-8">No incoming play requests.</p>
          </div>
          
          <div class="request-list">
            <div *ngFor="let req of incoming" class="request-card glass animate-slide-in">
              <div class="req-header flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                  <div class="avatar md">
                    <img *ngIf="req.from.avatar; else noAvatar" [src]="getAvatarUrl(req.from.avatar)" alt="Avatar" />
                    <ng-template #noAvatar>{{ req.from.name.charAt(0).toUpperCase() }}</ng-template>
                  </div>
                  <div>
                    <div class="font-bold"><a [routerLink]="['/profile', req.from._id]" class="text-white hover-primary">{{ req.from.name }}</a></div>
                    <div class="text-xs text-muted">{{ req.createdAt | date:'medium' }}</div>
                  </div>
                </div>
                <div class="status-badge" [ngClass]="'status-' + req.status">{{ req.status }}</div>
              </div>
              
              <div class="req-body">
                <div class="mb-2"><span class="text-muted">Sport: </span> <app-sport-badge [sport]="req.sport"></app-sport-badge></div>
                <div *ngIf="req.message" class="msg-box">"{{ req.message }}"</div>
              </div>
              
              <div class="req-footer mt-4 pt-4 border-t" *ngIf="req.status === 'pending'">
                <div class="flex gap-3">
                  <button class="btn btn-outline" style="flex:1" (click)="respond(req._id, 'declined')">Decline</button>
                  <button class="btn btn-primary" style="flex:1" (click)="respond(req._id, 'accepted')">Accept to Chat</button>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- OUTGOING REQUESTS -->
        <ng-container *ngIf="activeTab === 'outgoing'">
          <div *ngIf="outgoing.length === 0" class="empty-state glass">
            <p class="text-muted text-center p-8">You haven't sent any play requests.</p>
          </div>
          
          <div class="request-list">
            <div *ngFor="let req of outgoing" class="request-card glass animate-slide-in">
              <div class="req-header flex justify-between items-center mb-4">
                <div class="flex items-center gap-3">
                  <div class="avatar md">
                    <img *ngIf="req.to.avatar; else noAvatar2" [src]="getAvatarUrl(req.to.avatar)" alt="Avatar" />
                    <ng-template #noAvatar2>{{ req.to.name.charAt(0).toUpperCase() }}</ng-template>
                  </div>
                  <div>
                    <div class="font-bold">To: <a [routerLink]="['/profile', req.to._id]" class="text-white hover-primary">{{ req.to.name }}</a></div>
                    <div class="text-xs text-muted">{{ req.createdAt | date:'medium' }}</div>
                  </div>
                </div>
                <div class="status-badge" [ngClass]="'status-' + req.status">{{ req.status }}</div>
              </div>
              
              <div class="req-body">
                <div class="mb-2"><span class="text-muted">Sport: </span> <app-sport-badge [sport]="req.sport"></app-sport-badge></div>
                <div *ngIf="req.message" class="msg-box">"{{ req.message }}"</div>
              </div>
            </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; }
    .tab-btn { background: none; border: none; color: var(--color-text-muted); padding: 8px 16px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: var(--transition); border-radius: var(--radius-md); }
    .tab-btn:hover { color: var(--color-text); background: rgba(255,255,255,0.05); }
    .tab-btn.active { color: var(--color-primary); background: var(--color-primary-dim); }
    .empty-state { border-radius: var(--radius-lg); }
    .p-8 { padding: 32px; }
    .request-list { display: flex; flex-direction: column; gap: 16px; }
    .request-card { padding: 20px; }
    .text-white { color: var(--color-text); text-decoration: none; }
    .hover-primary:hover { color: var(--color-primary); }
    .status-badge { padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    .status-pending { background: rgba(255,193,7,0.15); color: var(--color-accent); border: 1px solid rgba(255,193,7,0.3); }
    .status-accepted { background: rgba(0,230,118,0.15); color: var(--color-success); border: 1px solid rgba(0,230,118,0.3); }
    .status-declined { background: rgba(255,83,112,0.15); color: var(--color-danger); border: 1px solid rgba(255,83,112,0.3); }
    .msg-box { background: rgba(0,0,0,0.2); padding: 12px; border-radius: var(--radius-sm); font-style: italic; color: var(--color-text-muted); font-size: 0.9rem; margin-top: 8px; border-left: 3px solid var(--color-border); }
    .border-t { border-top: 1px solid var(--color-border); }
    .pt-4 { padding-top: 16px; }
  `]
})
export class RequestsComponent implements OnInit {
  incoming: PlayRequest[] = [];
  outgoing: PlayRequest[] = [];
  isLoading = true;
  activeTab: 'incoming' | 'outgoing' = 'incoming';

  constructor(private requestService: RequestService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  fetchRequests() {
    this.isLoading = true;
    this.requestService.listRequests().subscribe({
      next: (res: any) => {
        this.incoming = res.incoming;
        this.outgoing = res.outgoing;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get pendingIncomingCount() {
    return this.incoming.filter(r => r.status === 'pending').length;
  }

  getAvatarUrl(avatar: string | null) {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${avatar}`;
  }

  respond(id: string, status: 'accepted' | 'declined') {
    this.requestService.respondToRequest(id, status).subscribe({
      next: () => {
        // Update local state
        const req = this.incoming.find(r => r._id === id);
        if (req) req.status = status;
      },
      error: (err: any) => {
        console.error('Failed to respond', err);
      }
    });
  }
}
