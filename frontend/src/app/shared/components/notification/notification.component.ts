import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification" [class]="'notification-' + type" *ngIf="visible">
      <div class="notification-content">
        <span class="notification-icon">{{ getIcon() }}</span>
        <span class="notification-message">{{ message }}</span>
      </div>
      <button class="notification-close" (click)="onClose()" *ngIf="dismissible">×</button>
    </div>
  `,
  styles: [`
    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .notification-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .notification-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .notification-warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .notification-info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .notification-icon {
      font-weight: bold;
      font-size: 16px;
    }

    .notification-message {
      flex: 1;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      margin-left: 10px;
      opacity: 0.7;
    }

    .notification-close:hover {
      opacity: 1;
    }
  `]
})
export class NotificationComponent {
  @Input() visible = false;
  @Input() type: NotificationType = 'info';
  @Input() message = '';
  @Input() dismissible = true;
  
  @Output() close = new EventEmitter<void>();

  getIcon(): string {
    switch (this.type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }

  onClose(): void {
    this.close.emit();
  }
}