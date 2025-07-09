import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('AuthService: Initializing auth service');
    console.log('AuthService: API_URL set to:', this.API_URL);
    this.loadUserFromStorage();
    this.testBackendConnectivity();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('AuthService: Attempting login for user:', credentials.email);
    console.log('AuthService: API URL:', `${this.API_URL}/auth/login`);
    console.log('AuthService: Request payload:', credentials);
    
    const startTime = Date.now();
    const headers = this.getApiHeaders();
    
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials, { headers })
      .pipe(
        tap(response => {
          const endTime = Date.now();
          console.log('AuthService: Login successful in', endTime - startTime, 'ms');
          console.log('AuthService: Response:', response);
          this.setCurrentUser(response.user);
          this.setToken(response.access_token);
          console.log('AuthService: User and token stored successfully');
        }),
        catchError(error => {
          const endTime = Date.now();
          console.error('AuthService: Login failed after', endTime - startTime, 'ms');
          console.error('AuthService: Error status:', error.status);
          console.error('AuthService: Error statusText:', error.statusText);
          console.error('AuthService: Error headers:', error.headers);
          console.error('AuthService: Error body:', error.error);
          console.error('AuthService: Error URL:', error.url);
          console.error('AuthService: Full error object:', error);
          
          if (error.status === 0) {
            console.error('AuthService: Network error - backend may not be running or CORS issue');
          }
          
          throw error;
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('AuthService: Attempting registration for user:', userData.email);
    console.log('AuthService: API URL:', `${this.API_URL}/auth/register`);
    
    const headers = this.getApiHeaders();
    
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData, { headers })
      .pipe(
        tap(response => {
          console.log('AuthService: Registration successful, response:', response);
          this.setCurrentUser(response.user);
          this.setToken(response.access_token);
          console.log('AuthService: User and token stored successfully');
        }),
        catchError(error => {
          console.error('AuthService: Registration failed:', error);
          console.error('AuthService: Error status:', error.status);
          console.error('AuthService: Error message:', error.error);
          throw error;
        })
      );
  }

  logout(): void {
    console.log('AuthService: Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    console.log('AuthService: Logout completed');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    const isAuth = !!token && !!user;
    console.log('AuthService: Checking authentication - Token:', !!token, 'User:', !!user, 'Result:', isAuth);
    return isAuth;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('AuthService: Retrieved token from storage:', token ? 'Token exists' : 'No token found');
    return token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setCurrentUser(user: User): void {
    console.log('AuthService: Setting current user:', user);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private setToken(token: string): void {
    console.log('AuthService: Setting token in storage');
    localStorage.setItem('token', token);
  }

  private loadUserFromStorage(): void {
    console.log('AuthService: Loading user from storage');
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      console.log('AuthService: User loaded from storage:', user);
      this.currentUserSubject.next(user);
    } else {
      console.log('AuthService: No user found in storage');
    }
  }

  private testBackendConnectivity(): void {
    console.log('AuthService: Testing backend connectivity...');
    // Simple health check - this might not exist but will help identify connection issues
    const headers = this.getApiHeaders();
    
    this.http.get(`${this.API_URL}/health`, { headers }).subscribe({
      next: (response) => {
        console.log('AuthService: Backend health check successful:', response);
      },
      error: (error) => {
        console.warn('AuthService: Backend health check failed (this is normal if /health endpoint does not exist):', error.status);
        if (error.status === 0) {
          console.error('AuthService: Cannot connect to backend at', this.API_URL);
          console.error('AuthService: Please ensure the backend is running on port 3000');
        }
      }
    });
  }

  private getApiHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': 'your-secure-api-key-here'
    });
  }
}