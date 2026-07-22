import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;

  // Reactive signals for user state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  register(data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    sports?: string[];
    skillLevel?: string;
  }) {
    return this.http.post<{ token: string; user: User }>(`${this.API}/auth/register`, data).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${this.API}/auth/login`, { email, password }).pipe(
      tap((res) => this.saveSession(res))
    );
  }

  logout() {
    localStorage.removeItem('pc_token');
    localStorage.removeItem('pc_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('pc_token');
  }

  refreshCurrentUser() {
    return this.http.get<{ user: User }>(`${this.API}/auth/me`).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        localStorage.setItem('pc_user', JSON.stringify(res.user));
      })
    );
  }

  updateCurrentUser(user: User) {
    this.currentUser.set(user);
    localStorage.setItem('pc_user', JSON.stringify(user));
  }

  private saveSession(res: { token: string; user: User }) {
    localStorage.setItem('pc_token', res.token);
    localStorage.setItem('pc_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private loadFromStorage() {
    const token = localStorage.getItem('pc_token');
    const userRaw = localStorage.getItem('pc_user');
    if (token && userRaw) {
      try {
        this.currentUser.set(JSON.parse(userRaw));
        this.isAuthenticated.set(true);
      } catch {
        this.logout();
      }
    }
  }
}
