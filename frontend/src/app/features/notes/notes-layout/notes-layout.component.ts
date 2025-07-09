import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotesListComponent } from '../notes-list/notes-list.component';

@Component({
  selector: 'app-notes-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotesListComponent],
  template: `
    <div class="notes-layout">
      <header class="header">
        <div class="header-content">
          <h1>Notes App</h1>
          <div class="user-menu">
            <span *ngIf="currentUser">Welcome, {{ currentUser.name || currentUser.email }}</span>
            <button class="btn btn-secondary" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <div class="main-content">
        <aside class="sidebar">
          <app-notes-list></app-notes-list>
        </aside>
        
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .notes-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
      padding: 0 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .user-menu span {
      color: #666;
      font-size: 14px;
    }

    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sidebar {
      width: 300px;
      background: #f8f9fa;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      background: #fff;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 250px;
      }
      
      .header-content {
        padding: 0 10px;
      }
      
      .user-menu span {
        display: none;
      }
    }
  `]
})
export class NotesLayoutComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}