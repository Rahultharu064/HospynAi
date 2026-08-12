import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';
import { DashboardStats } from '../../models/analytics.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatCardComponent } from '../../../../shared/components/card/stat-card.component';
import { BarChartComponent, BarDatum } from '../../../../shared/components/card/bar-chart.component';

@Component({
  selector: 'app-analytics-overview',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, SpinnerComponent, StatCardComponent, BarChartComponent],
  template: `
    <app-page-header title="Analytics" subtitle="Operational and financial performance at a glance." />

    @if (loading()) {
      <app-spinner />
    } @else {
    @if (stats(); as s) {
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card label="Total patients" [value]="s.overview.totalPatients" [delta]="s.overview.patientGrowth" />
        <app-stat-card label="Appointments" [value]="s.overview.totalAppointments" [delta]="s.overview.appointmentGrowth" />
        <app-stat-card label="Revenue" [value]="s.overview.totalRevenue | currency" [delta]="s.overview.revenueGrowth" />
        <app-stat-card label="Today's appointments" [value]="s.overview.todayAppointments" />
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card p-6">
          <h2 class="mb-4 font-display text-base font-semibold text-gray-900">Appointment outcomes</h2>
          <app-bar-chart [data]="appointmentBars(s)" />
          <dl class="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
            <div><dd class="text-base font-semibold text-gray-900">{{ s.appointments.completionRate }}%</dd><dt>Completion</dt></div>
            <div><dd class="text-base font-semibold text-gray-900">{{ s.appointments.cancellationRate }}%</dd><dt>Cancellation</dt></div>
            <div><dd class="text-base font-semibold text-gray-900">{{ s.appointments.noShowRate }}%</dd><dt>No-show</dt></div>
          </dl>
        </div>

        <div class="card p-6">
          <h2 class="mb-4 font-display text-base font-semibold text-gray-900">Revenue breakdown</h2>
          <app-bar-chart [data]="revenueBars(s)" />
          <dl class="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
            <div><dd class="text-base font-semibold text-gray-900">{{ s.revenue.collected | currency }}</dd><dt>Collected</dt></div>
            <div><dd class="text-base font-semibold text-gray-900">{{ s.revenue.pending | currency }}</dd><dt>Pending</dt></div>
            <div><dd class="text-base font-semibold text-danger-600">{{ s.revenue.overdue | currency }}</dd><dt>Overdue</dt></div>
          </dl>
        </div>

        <div class="card p-6 lg:col-span-2">
          <h2 class="mb-4 font-display text-base font-semibold text-gray-900">Top doctors by volume</h2>
          <app-bar-chart [data]="topDoctorBars(s)" />
        </div>
      </div>
    }
    }
  `,
})
export class AnalyticsOverviewComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.analyticsService.getDashboard().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  appointmentBars(s: DashboardStats): BarDatum[] {
    return [
      { label: 'Completed', value: s.appointments.completed },
      { label: 'Cancelled', value: s.appointments.cancelled },
      { label: 'No-show', value: s.appointments.noShow },
    ];
  }

  revenueBars(s: DashboardStats): BarDatum[] {
    return Object.entries(s.revenue.byMethod ?? {}).map(([label, value]) => ({ label, value }));
  }

  topDoctorBars(s: DashboardStats): BarDatum[] {
    return (s.appointments.topDoctors ?? []).slice(0, 6).map((d) => ({ label: d.name, value: d.count }));
  }
}
