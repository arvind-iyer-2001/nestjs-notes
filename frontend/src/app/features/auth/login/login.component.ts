import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NotificationComponent],
  template: `
    <div class="auth-container">
      <div class="auth-form">
        <h2>Login</h2>
        
        <app-notification 
          [visible]="!!errorMessage" 
          [type]="'error'" 
          [message]="errorMessage"
          (close)="errorMessage = ''">
        </app-notification>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email:</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              placeholder="Enter your email">
            <div class="error-message" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">Email is required</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Please enter a valid email</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password:</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              placeholder="Enter your password">
            <div class="error-message" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <span *ngIf="loginForm.get('password')?.errors?.['required']">Password is required</span>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-full"
            [disabled]="loginForm.invalid || loading">
            <span *ngIf="loading">Logging in...</span>
            <span *ngIf="!loading">Login</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a routerLink="/auth/signup">Sign up</a></p>
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
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  returnUrl = '/notes';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('LoginComponent: Constructor called');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
    console.log('LoginComponent: Form initialized');
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/notes';
    console.log('LoginComponent: Initialized with return URL:', this.returnUrl);
    
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      console.log('LoginComponent: User already authenticated, redirecting to:', this.returnUrl);
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    console.log('LoginComponent: Form submitted');
    console.log('LoginComponent: Form valid:', this.loginForm.valid);
    console.log('LoginComponent: Form value:', this.loginForm.value);
    
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      console.log('LoginComponent: Starting login process');

      // Test backend connectivity first
      console.log('LoginComponent: Testing backend connectivity...');
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          console.log('LoginComponent: Login successful, response:', response);
          console.log('LoginComponent: Navigating to:', this.returnUrl);
          this.loading = false;
          this.router.navigate([this.returnUrl]);
        },
        error: (error) => {
          console.error('LoginComponent: Login failed:', error);
          console.error('LoginComponent: Error status:', error.status);
          console.error('LoginComponent: Error statusText:', error.statusText);
          console.error('LoginComponent: Error body:', error.error);
          console.error('LoginComponent: Error url:', error.url);
          console.error('LoginComponent: Full error object:', error);
          
          this.loading = false;
          
          // Provide more specific error messages
          if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:3000';
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 404) {
            this.errorMessage = 'Login endpoint not found. Please check the backend configuration.';
          } else {
            this.errorMessage = error.error?.message || `Login failed with status ${error.status}. Please try again.`;
          }
          
          console.log('LoginComponent: Error message set to:', this.errorMessage);
        }
      });
    } else {
      console.log('LoginComponent: Form is invalid');
      console.log('LoginComponent: Form errors:', this.loginForm.errors);
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control && control.errors) {
          console.log(`LoginComponent: Field ${key} errors:`, control.errors);
        }
      });
    }
  }
}