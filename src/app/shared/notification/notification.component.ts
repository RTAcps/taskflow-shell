import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Notification, NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div
        *ngFor="let notification of notifications"
        class="notification"
        [ngClass]="'notification-' + notification.type"
        (click)="removeNotification(notification.id)"
      >
        <div class="notification-message">{{ notification.message }}</div>
        <div class="notification-close">&times;</div>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }
    
    .notification {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16);
      background-color: white;
      color: #333;
      font-size: 14px;
      animation: slide-in 0.3s ease;
      cursor: pointer;
    }
    
    .notification-success {
      border-left: 4px solid #4caf50;
    }
    
    .notification-info {
      border-left: 4px solid #2196f3;
    }
    
    .notification-warning {
      border-left: 4px solid #ff9800;
    }
    
    .notification-error {
      border-left: 4px solid #f44336;
    }
    
    .notification-message {
      flex: 1;
      margin-right: 10px;
    }
    
    .notification-close {
      font-size: 18px;
      font-weight: bold;
      color: #aaa;
      cursor: pointer;
    }
    
    .notification-close:hover {
      color: #333;
    }
    
    @keyframes slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit() {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }
  
  removeNotification(id: string) {
    this.notificationService.remove(id);
  }
}
