import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="variant">
      <span *ngIf="showDot" class="status-dot"></span>
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 9999px;
      background-color: var(--badge-background);
      color: var(--badge-text);
      border: 1px solid var(--border);
      white-space: nowrap;
    }
    .status-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: var(--primary-text);
    }
    .outline {
      background-color: transparent;
      border-color: var(--chip-border);
    }
    .solid {
      background-color: var(--primary-button);
      color: var(--primary-button-text);
      border-color: var(--primary-button);
    }
    .solid .status-dot {
      background-color: var(--primary-button-text);
    }
  `]
})
export class BadgeComponent {
  @Input() variant: 'default' | 'outline' | 'solid' = 'default';
  @Input() showDot: boolean = false;
}
