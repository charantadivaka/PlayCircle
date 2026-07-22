import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page animate-fade-in">
      <div class="profile-header flex items-center justify-between">
        <h2>My Profile</h2>
      </div>

      <div class="profile-content mt-4">
        <div class="profile-card glass">
          <div *ngIf="successMsg" class="alert alert-success">{{ successMsg }}</div>
          <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            
            <div class="avatar-upload-section">
              <div class="avatar xl mb-4">
                <img *ngIf="avatarPreview" [src]="avatarPreview" alt="Avatar Preview" />
                <img *ngIf="!avatarPreview && userAvatar" [src]="userAvatar" alt="Avatar" />
                <ng-template #noAvatar *ngIf="!avatarPreview && !userAvatar">
                  {{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}
                </ng-template>
              </div>
              
              <div class="form-group mb-0">
                <input type="file" id="avatar" (change)="onFileSelected($event)" accept="image/*" class="file-input" #fileInput />
                <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()">
                  Change Picture
                </button>
              </div>
            </div>

            <div class="divider mt-4"></div>

            <div class="form-row flex gap-4 mt-4">
              <div class="form-group" style="flex: 1;">
                <label for="name">Full Name</label>
                <input type="text" id="name" formControlName="name" [class.is-invalid]="f['name'].invalid && f['name'].touched" />
              </div>
              <div class="form-group" style="flex: 1;">
                <label for="email">Email (Read Only)</label>
                <input type="email" id="email" [value]="auth.currentUser()?.email" disabled />
              </div>
            </div>

            <div class="form-row flex gap-4">
              <div class="form-group" style="flex: 1;">
                <label for="age">Age</label>
                <input type="number" id="age" formControlName="age" />
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

            <div class="form-group">
              <label for="bio">Bio</label>
              <textarea id="bio" formControlName="bio" placeholder="Tell others about yourself..."></textarea>
            </div>

            <div class="form-group">
              <label>Sports Interests</label>
              <div class="sports-checkboxes">
                <label class="sport-checkbox" *ngFor="let s of availableSports">
                  <input type="checkbox" [checked]="selectedSports.includes(s)" (change)="toggleSport(s, $event)" />
                  <span>{{ s }}</span>
                </label>
              </div>
            </div>

            <div class="divider mt-4"></div>

            <div class="flex justify-between items-center mt-4">
              
              <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || isLoading">
                <span *ngIf="isLoading" class="spinner-small"></span>
                <span *ngIf="!isLoading">Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-card { padding: 32px; max-width: 800px; margin: 0 auto; }
    .avatar-upload-section { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 0; }
    .file-input { display: none; }
    .sports-checkboxes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
    .sport-checkbox { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: var(--radius-full); border: 1px solid var(--color-border); transition: var(--transition); }
    .sport-checkbox:hover { background: rgba(255,255,255,0.1); }
    .sport-checkbox input:checked + span { color: var(--color-primary); font-weight: 600; }
    .sport-checkbox input { cursor: pointer; }
    .alert-success { background: rgba(0, 230, 118, 0.15); border: 1px solid var(--color-success); color: var(--color-success); }
    .spinner-small { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 0.8s linear infinite; }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  successMsg = '';
  errorMsg = '';
  selectedFile: File | null = null;
  avatarPreview: string | null = null;
  
  availableSports = ['Cricket', 'Football', 'Badminton', 'Volleyball', 'Basketball', 'Tennis', 'Chess', 'Table Tennis', 'Running', 'Cycling'];
  selectedSports: string[] = [];

  constructor(private fb: FormBuilder, public auth: AuthService, private userService: UserService) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      age: [''],
      skillLevel: ['Beginner'],
      bio: ['']
    });
  }

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        age: user.age,
        skillLevel: user.skillLevel,
        bio: user.bio
      });
      this.selectedSports = [...user.sports];
    }
  }

  get f() { return this.profileForm.controls; }
  
  get userAvatar() {
    const avatar = this.auth.currentUser()?.avatar;
    return avatar ? `${environment.apiUrl.replace('/api', '')}/uploads/${avatar}` : null;
  }

  toggleSport(sport: string, event: any) {
    if (event.target.checked) {
      this.selectedSports.push(sport);
    } else {
      this.selectedSports = this.selectedSports.filter(s => s !== sport);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;
    
    this.isLoading = true;
    this.successMsg = '';
    this.errorMsg = '';
    
    const formData = new FormData();
    formData.append('name', this.profileForm.value.name);
    if (this.profileForm.value.age) formData.append('age', this.profileForm.value.age);
    formData.append('skillLevel', this.profileForm.value.skillLevel);
    formData.append('bio', this.profileForm.value.bio || '');
    formData.append('sports', JSON.stringify(this.selectedSports));
    
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    
    this.userService.updateProfile(formData).subscribe({
      next: (res: any) => {
        this.auth.updateCurrentUser(res.user);
        this.successMsg = 'Profile updated successfully!';
        this.isLoading = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err: any) => {
        this.errorMsg = err.error?.message || 'Failed to update profile';
        this.isLoading = false;
      }
    });
  }
}
