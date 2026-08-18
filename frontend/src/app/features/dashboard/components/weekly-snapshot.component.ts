import { Component, Input } from '@angular/core';
import { BarChartComponent, BarDatum } from '../../../shared/components/card/bar-chart.component';
import { AppointmentAnalytics } from '../../analytics/models/analytics.model';

@Component({
  selector: 'app-weekly-snapshot',
  standalone: true,
  imports: [BarChartComponent],
  template: `
    <div class="card flex h-full flex-col p-5">
      <h2 class="font-display text-base font-semibold text-gray-900">This week</h2>
      <p class="text-xs text-gray-500">Appointment volume, last 7 weeks</p>

      <div class="mt-4">
        @if (loading) {
          <div class="space-y-2.5" aria-hidden="true">
            @for (i of skeletonRows; track i) {
              <div class="h-2.5 animate-pulse rounded-full bg-gray-100"></div>
            }
          </div>
        } @else if (trend.length === 0) {
          <p class="py-6 text-center text-xs text-gray-400">Not enough data yet.</p>
        } @else {
          <app-bar-chart [data]="trend" />
        }
      </div>

      @if (!loading && data) {
        <div class="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
          <div>
            <p class="font-display text-lg font-semibold text-success-600">{{ data.completionRate.toFixed(0) }}%</p>
            <p class="text-2xs uppercase tracking-wide text-gray-400">Completed</p>
          </div>
          <div>
            <p class="font-display text-lg font-semibold text-warning-600">{{ data.noShowRate.toFixed(0) }}%</p>
            <p class="text-2xs uppercase tracking-wide text-gray-400">No-shows</p>
          </div>
          <div>
            <p class="font-display text-lg font-semibold text-danger-600">{{ data.cancellationRate.toFixed(0) }}%</p>
            <p class="text-2xs uppercase tracking-wide text-gray-400">Cancelled</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class WeeklySnapshotComponent {
  @Input() data: AppointmentAnalytics | null = null;
  @Input() loading = false;

  readonly skeletonRows = [1, 2, 3, 4, 5];

  get trend(): BarDatum[] {
    return (this.data?.weeklyTrend ?? []).map((w) => ({ label: w.week, value: w.count }));
  }
}
