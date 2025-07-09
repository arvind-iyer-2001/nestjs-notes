import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NotificationComponent],
  template: `
    <div class="auth-container">
      <div class="auth-form">
        <h2>Sign Up</h2>
        
        <app-notification 
          [visible]="!!errorMessage" 
          [type]="'error'" 
          [message]="errorMessage"
          (close)="errorMessage = ''">
        </app-notification>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Name (Optional):</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name"
              placeholder="Enter your name">
          </div>

          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="signupForm.get('email')?.invalid && signupForm.get('email')?.touched"
              placeholder="Enter your email">
            <div class="error-message" *ngIf="signupForm.get('email')?.invalid && signupForm.get('email')?.touched">
              <span *ngIf="signupForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="signupForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="signupForm.get('password')?.invalid && signupForm.get('password')?.touched"
              placeholder="Enter your password">
            <div class="error-message" *ngIf="signupForm.get('password')?.invalid && signupForm.get('password')?.touched">
              <span *ngIf="signupForm.get('password')?.errors?.['required']">Password is required</span>
              <span *ngIf="signupForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password:</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword"
              [class.error]="signupForm.get('confirmPassword')?.invalid && signupForm.get('confirmPassword')?.touched"
              placeholder="Confirm your password">
            <div class="error-message" *ngIf="signupForm.get('confirmPassword')?.invalid && signupForm.get('confirmPassword')?.touched">
              <span *ngIf="signupForm.get('confirmPassword')?.errors?.['required']">Please confirm your password</span>
            </div>
            <div class="error-message" *ngIf="signupForm.hasError('passwordMismatch') && signupForm.get('confirmPassword')?.touched">
              Passwords do not match
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-full"
            [disabled]="signupForm.invalid || loading">
            <span *ngIf="loading">Creating account...</span>
            <span *ngIf="!loading">Sign Up</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Login</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      padding: 20px;
    }

    .auth-form {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }

    input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
    }

    input.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-full {
      width: 100%;
    }

    .auth-footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .auth-footer a {
      color: #007bff;
      text-decoration: none;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { confirmPassword, ...signupData } = this.signupForm.value;

      this.authService.register(signupData).subscribe({
        next: () => {
          this.router.navigate(['/notes']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}