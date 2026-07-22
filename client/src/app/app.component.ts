import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { SocketService } from './core/services/socket.service';
import { NotificationService } from './core/services/notification.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar *ngIf="auth.isAuthenticated()" />
    <main [class.with-navbar]="auth.isAuthenticated()">
      <router-outlet />
    </main>
  `,
  styles: [`
    main { min-height: 100vh; }
    main.with-navbar { padding-top: 64px; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];

  constructor(
    public auth: AuthService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {
    // Whenever auth state changes, connect/disconnect socket
    effect(() => {
      const token = this.auth.getToken();
      if (this.auth.isAuthenticated() && token) {
        this.socketService.connect(token);
        this.listenToSocketEvents();
      } else {
        this.socketService.disconnect();
      }
    });
  }

  ngOnInit() {}

  private listenToSocketEvents() {
    this.subs.push(
      this.socketService.playRequest$.subscribe(({ playRequest }) => {
        this.notificationService.add({
          type: 'request',
          title: 'New Play Request! 🏆',
          body: `${playRequest.from.name} wants to play ${playRequest.sport} with you`,
          data: playRequest,
        });
      }),
      this.socketService.requestResponse$.subscribe(({ playRequest }) => {
        if (playRequest.status === 'accepted') {
          this.notificationService.add({
            type: 'accepted',
            title: 'Request Accepted! 🎉',
            body: `${playRequest.to.name} accepted your ${playRequest.sport} request`,
            data: playRequest,
          });
        }
      }),
      this.socketService.message$.subscribe(({ message }) => {
        const sender = typeof message.sender === 'object' ? message.sender : null;
        if (sender) {
          this.notificationService.add({
            type: 'message',
            title: `New message from ${sender.name}`,
            body: message.text,
            data: message,
          });
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
