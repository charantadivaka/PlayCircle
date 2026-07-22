import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { RequestService } from '../../core/services/request.service';
import { User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';
import { SportBadgeComponent } from '../../shared/components/sport-badge/sport-badge.component';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SportBadgeComponent, ReactiveFormsModule],
  template: `
    <div class="page animate-fade-in">
      <a routerLink="/dashboard" class="btn btn-ghost btn-sm mb-4">← Back to Map</a>
      
      <div *ngIf="isLoading" class="loading-center">
        <div class="spinner"></div>
      </div>
      
      <div *ngIf="!isLoading && !player" class="alert alert-danger">
        Player not found.
      </div>
      
      <div class="profile-layout" *ngIf="!isLoading && player">
        
        <div class="left-col">
          <div class="player-card glass text-center">
            <div class="avatar xl mx-auto mb-4 relative">
              <img *ngIf="player.avatar; else noAvatar" [src]="getAvatarUrl()" alt="Avatar" />
              <ng-template #noAvatar>{{ player.name.charAt(0).toUpperCase() }}</ng-template>
              <div class="status-indicator xl-ind" [class.online]="player.isOnline" [title]="player.isOnline ? 'Online' : 'Offline'"></div>
            </div>
            
            <h2>{{ player.name }}</h2>
            <p class="meta text-muted mt-2">
              <span *ngIf="player.age">{{ player.age }} years • </span>
              <span>{{ player.skillLevel }}</span>
            </p>
            
            <div class="divider mt-4 mb-4"></div>
            
            <button class="btn btn-primary w-full" *ngIf="!showRequestForm && !requestSent" (click)="showRequestForm = true">
              Send Play Request
            </button>
            
            <div *ngIf="requestSent" class="alert alert-success mt-2 mb-0" style="padding: 10px; text-align: center;">
              Request sent successfully!
            </div>
            
            <form *ngIf="showRequestForm && !requestSent" [formGroup]="requestForm" (ngSubmit)="sendRequest()" class="request-form text-left mt-4 animate-slide-in">
              <h4 class="mb-2 text-sm">Send Request</h4>
              
              <div class="form-group">
                <label>Sport to play</label>
                <select formControlName="sport" class="form-control" [class.is-invalid]="f['sport'].invalid && f['sport'].touched">
                  <option value="" disabled>Select sport</option>
                  <option *ngFor="let s of player.sports" [value]="s">{{ s }}</option>
                </select>
              </div>
              
              <div class="form-group mt-2">
                <label>Message (optional)</label>
                <textarea formControlName="message" placeholder="Hey, want to play later today?" style="min-height: 60px;"></textarea>
              </div>
              
              <div *ngIf="errorMsg" class="error-msg text-center mb-2">{{ errorMsg }}</div>
              
              <div class="flex gap-2 mt-2">
                <button type="button" class="btn btn-ghost" style="flex:1" (click)="showRequestForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" style="flex:1" [disabled]="requestForm.invalid || isSending">
                  <span *ngIf="isSending" class="spinner-small"></span>
                  <span *ngIf="!isSending">Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div class="right-col flex-col gap-4">
          <div class="glass p-6">
            <h3>About</h3>
            <p class="mt-4 text-muted" *ngIf="player.bio">{{ player.bio }}</p>
            <p class="mt-4 text-muted italic" *ngIf="!player.bio">No bio provided.</p>
          </div>
          
          <div class="glass p-6 mt-4">
            <h3>Sports Interests</h3>
            <div class="sports-list mt-4">
              <app-sport-badge *ngFor="let s of player.sports" [sport]="s"></app-sport-badge>
              <div *ngIf="player.sports.length === 0" class="text-muted text-sm">No sports selected.</div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    .profile-layout { display: flex; gap: 24px; align-items: flex-start; }
    .left-col { width: 340px; flex-shrink: 0; }
    .right-col { flex: 1; }
    .player-card { padding: 32px 24px; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .p-6 { padding: 24px; }
    .relative { position: relative; }
    .status-indicator.xl-ind { width: 18px; height: 18px; bottom: 4px; right: 4px; border-width: 3px; }
    .status-indicator.online { background: var(--color-success); box-shadow: 0 0 8px var(--color-success); }
    .status-indicator { position: absolute; border-radius: 50%; background: var(--color-text-dim); border: 2.5px solid var(--color-surface); }
    .sports-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .request-form { background: rgba(255,255,255,0.03); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
    .alert-success { background: rgba(0, 230, 118, 0.15); border: 1px solid var(--color-success); color: var(--color-success); }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .italic { font-style: italic; }
    
    @media (max-width: 768px) {
      .profile-layout { flex-direction: column; }
      .left-col, .right-col { width: 100%; }
    }
  `]
})
export class PlayerDetailComponent implements OnInit {
  player: User | null = null;
  isLoading = true;
  
  showRequestForm = false;
  requestSent = false;
  isSending = false;
  errorMsg = '';
  
  requestForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private requestService: RequestService,
    private fb: FormBuilder
  ) {
    this.requestForm = this.fb.group({
      sport: ['', Validators.required],
      message: ['']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchPlayer(id);
      }
    });
  }
  
  get f() { return this.requestForm.controls; }

  fetchPlayer(id: string) {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (res: any) => {
        this.player = res.user;
        
        // If player has only 1 sport, auto-select it
        if (this.player?.sports?.length === 1) {
          this.requestForm.patchValue({ sport: this.player?.sports[0] });
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
      }
    });
  }
  
  getAvatarUrl() {
    return `${environment.apiUrl.replace('/api', '')}/uploads/${this.player?.avatar}`;
  }
  
  sendRequest() {
    if (this.requestForm.invalid || !this.player) return;
    
    this.isSending = true;
    this.errorMsg = '';
    
    const { sport, message } = this.requestForm.value;
    
    this.requestService.sendRequest(this.player._id, sport, message).subscribe({
      next: (res: any) => {
        this.isSending = false;
        this.requestSent = true;
        this.showRequestForm = false;
      },
      error: (err: any) => {
        this.isSending = false;
        this.errorMsg = err.error?.message || 'Failed to send request';
      }
    });
  }
}
