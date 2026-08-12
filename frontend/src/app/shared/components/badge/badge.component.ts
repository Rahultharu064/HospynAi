import { Component, Input, computed, signal } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  CONFIRMED: 'success',
  COMPLETED: 'success',
  PAID: 'success',
  SUCCESS: 'success',
  SIGNED: 'success',
  APPROVED: 'success',
  DELIVERED: 'success',
  READ: 'success',
  SENT: 'info',
  SCHEDULED: 'info',
  PENDING: 'warning',
  PENDING_VERIFICATION: 'warning',
  IN_PROGRESS: 'warning',
  CHECKED_IN: 'warning',
  DRAFT: 'neutral',
  INACTIVE: 'neutral',
  CANCELLED: 'danger',
  FAILED: 'danger',
  SUSPENDED: 'danger',
  OVERDUE: 'danger',
  NO_SHOW: 'danger',
  EXPIRED: 'danger',
  REJECTED: 'danger',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="toneClasses()">{{ label() }}</span>
  `,
})
export class BadgeComponent {
  @Input({ required: true }) set status(value: string) {
    this._status.set(value);
  }
  @Input() tone?: BadgeTone;

  private _status = signal('');

  label = computed(() =>
    this._status()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );

  toneClasses = computed(() => {
    const tone = this.tone ?? STATUS_TONE_MAP[this._status()] ?? 'neutral';
    const map: Record<BadgeTone, string> = {
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      danger: 'bg-danger-100 text-danger-700',
      info: 'bg-info-100 text-info-700',
      neutral: 'bg-gray-100 text-gray-700',
    };
    return map[tone];
  });
}
