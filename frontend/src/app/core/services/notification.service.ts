import { Injectable, signal, computed } from '@angular/core';
import { NotificationItem } from '../models/marketplace.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Pure real notification signal (Zero Fake Data Policy)
  notifications = signal<NotificationItem[]>([]);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  markAsRead(id: string): void {
    this.notifications.update(items =>
      items.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllAsRead(): void {
    this.notifications.update(items => items.map(n => ({ ...n, read: true })));
  }

  addNotification(notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> & { timestamp?: string; read?: boolean }): void {
    const newNotif: NotificationItem = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: notif.timestamp || 'Just now',
      read: notif.read ?? false
    };
    this.notifications.update(items => [newNotif, ...items]);
  }
}
