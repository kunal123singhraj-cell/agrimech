import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="notifications-page">
      <div class="notif-header">
        <div>
          <h2 class="page-title">Notifications</h2>
          <p class="page-subtitle">Operational alerts on counter-offers, logistics dispatches, and supply pooling milestones.</p>
        </div>
        <button
          *ngIf="notificationService.unreadCount() > 0"
          class="btn-secondary btn-sm"
          (click)="notificationService.markAllAsRead()"
        >
          <app-icon name="check" [size]="13"></app-icon>
          <span>Mark All as Read</span>
        </button>
      </div>

      <div class="notif-list">
        <div
          *ngFor="let item of notificationService.notifications()"
          class="notif-card"
          [class.unread]="!item.read"
          (click)="notificationService.markAsRead(item.id)"
        >
          <div class="notif-icon-col">
            <app-icon
              [name]="item.type === 'offer' ? 'message' : (item.type === 'order' ? 'truck' : (item.type === 'pool' ? 'layers' : 'bell'))"
              [size]="16"
            ></app-icon>
          </div>

          <div class="notif-content-col">
            <div class="notif-top">
              <span class="notif-title">{{ item.title }}</span>
              <span class="notif-time">{{ item.timestamp }}</span>
            </div>
            <p class="notif-message">{{ item.message }}</p>

            <div *ngIf="item.link" class="notif-action-row">
              <a [routerLink]="item.link" class="notif-link">
                <span>View Details</span>
                <app-icon name="arrow-right" [size]="12"></app-icon>
              </a>
            </div>
          </div>

          <div class="notif-status-col">
            <span *ngIf="!item.read" class="unread-dot"></span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 800px;
    }

    .notif-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--secondary-text);
      margin-top: 2px;
    }

    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .notif-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 16px;
      background-color: var(--card-background);
      display: flex;
      gap: 14px;
      align-items: flex-start;
      cursor: pointer;
      transition: background-color 120ms ease;
    }

    .notif-card:hover {
      background-color: var(--hover-background);
    }

    .notif-card.unread {
      background-color: var(--sidebar-background);
      border-color: var(--chip-border);
    }

    .notif-icon-col {
      padding-top: 2px;
      color: var(--secondary-text);
    }

    .notif-content-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notif-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notif-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .notif-time {
      font-size: 11px;
      color: var(--secondary-text);
    }

    .notif-message {
      font-size: 13px;
      color: var(--secondary-text);
      line-height: 1.45;
    }

    .notif-action-row {
      margin-top: 4px;
    }

    .notif-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--primary-text);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .notif-status-col {
      padding-top: 6px;
    }

    .unread-dot {
      display: block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--primary-text);
    }
  `]
})
export class NotificationsComponent {
  notificationService = inject(NotificationService);
}
