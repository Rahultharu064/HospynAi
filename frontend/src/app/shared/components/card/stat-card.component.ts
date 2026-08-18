import { Component, Input } from '@angular/core';
import { CountUpDirective } from '../../directives/count-up.directive';

export type StatCardTone = 'navy' | 'teal' | 'indigo' | 'success' | 'warning';

const TONE_CHIP_CLASSES: Record<StatCardTone, string> = {
  navy: 'bg-navy-50 text-navy-600',
  teal: 'bg-teal-50 text-teal-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
};

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CountUpDirective],
  template: `
    <div class="card group relative p-5 transition-all duration-moderate ease-default hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-500">{{ label }}</p>
          <p class="mt-2 font-display text-display-sm font-semibold tabular-nums text-gray-900">
            @if (numericValue !== undefined && numericValue !== null) {
              <span
                [appCountUp]="numericValue"
                [countPrefix]="prefix"
                [countSuffix]="suffix"
                [countDecimals]="decimals"
              >{{ prefix }}0{{ suffix }}</span>
            } @else {
              {{ value }}
            }
          </p>
        </div>
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg transition-transform duration-moderate ease-default group-hover:scale-105"
          [class]="chipClasses()"
        >
          {{ icon }}
        </div>
      </div>

      @if (delta !== undefined && delta !== null) {
        <div class="mt-3 flex items-center gap-1.5">
          <span
            class="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold"
            [class]="delta >= 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'"
          >
            <span aria-hidden="true">{{ delta >= 0 ? '↑' : '↓' }}</span>
            {{ absDelta() }}%
          </span>
          <span class="text-xs text-gray-400">{{ deltaLabel }}</span>
        </div>
      }
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = '';
  /** When set, the value animates as a counting number instead of rendering `value` directly. */
  @Input() numericValue?: number | null;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() decimals = 0;
  @Input() icon = '📊';
  @Input() tone: StatCardTone = 'navy';
  @Input() delta?: number | null;
  @Input() deltaLabel = 'vs last period';

  chipClasses(): string {
    return TONE_CHIP_CLASSES[this.tone];
  }

  absDelta(): string {
    return Math.abs(this.delta ?? 0).toFixed(1);
  }
}
