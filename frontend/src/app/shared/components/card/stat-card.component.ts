import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-stat-card',
    imports: [],
    template: `
    <div class="card p-5">
      <p class="text-sm text-gray-500">{{ label }}</p>
      <p class="mt-1 font-display text-display-sm font-semibold text-gray-900">{{ value }}</p>
      @if (delta !== undefined && delta !== null) {
        <p class="mt-1 text-xs font-medium" [class]="delta >= 0 ? 'text-success-600' : 'text-danger-600'">
          {{ delta >= 0 ? '▲' : '▼' }} {{ absDelta() }}% {{ deltaLabel }}
        </p>
      }
    </div>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  @Input() delta?: number | null;
  @Input() deltaLabel = 'vs last period';

  absDelta(): string {
    return Math.abs(this.delta ?? 0).toFixed(1);
  }
}
