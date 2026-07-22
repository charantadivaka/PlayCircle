import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card glass animate-slide-in">
        <div class="auth-header">
          <div class="logo-circle mx-auto"></div>
          <h2>Create Account</h2>
          <p>Join PlayCircle today</p>
        </div>

        <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" formControlName="name" placeholder="John Doe" [class.is-invalid]="f['name'].invalid && f['name'].touched" />
            <div *ngIf="f['name'].invalid && f['name'].touched" class="error-msg">
              Name is required (min 2 characters)
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email" placeholder="you@example.com" [class.is-invalid]="f['email'].invalid && f['email'].touched" />
            <div *ngIf="f['email'].invalid && f['email'].touched" class="error-msg">
              Valid email is required
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" formControlName="password" placeholder="••••••••" [class.is-invalid]="f['password'].invalid && f['password'].touched" />
            <div *ngIf="f['password'].invalid && f['password'].touched" class="error-msg">
              Password is required (min 6 characters)
            </div>
          </div>

          <div class="form-row flex gap-4">
            <div class="form-group" style="flex: 1;">
              <label for="age">Age (optional)</label>
              <input type="number" id="age" formControlName="age" placeholder="25" />
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="skillLevel">Skill Level</label>
              <select id="skillLevel" formControlName="skillLevel">
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="isLoading" class="spinner-small"></span>
            <span *ngIf="!isLoading">Register</span>
          </button>
        </form>

        <div class="auth-footer text-center mt-4 text-sm">
          <span class="text-muted">Already have an account? </span>
          <a routerLink="/auth/login" class="font-bold">Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px 20px 40px; background: radial-gradient(circle at top right, var(--color-surface-2) 0%, var(--color-bg) 100%); }
    .auth-card { width: 100%; max-width: 480px; padding: 40px 32px; }
    .auth-header { text-align: center; margin-bottom: 24px; }
    .auth-header h2 { margin-top: 16px; margin-bottom: 8px; font-size: 1.8rem; }
    .logo-circle { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); box-shadow: 0 0 24px var(--color-primary-glow); margin: 0 auto; }
    .alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; font-size: 0.9rem; }
    .alert-danger { background: var(--color-danger-dim); border: 1px solid var(--color-danger); color: var(--color-danger); }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .text-center { text-align: center; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      age: [''],
      skillLevel: ['Beginner']
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit() {
    if (this.registerForm.invalid) return;
    
    this.isLoading = true;
    this.error = '';
    
    this.auth.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Registration failed';
        this.isLoading = false;
      }
    });
  }
}
