import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { DashboardStats } from '../../../analytics/models/analytics.model';
import { NavService } from '../../../../core/services/nav.service';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { StatCardComponent } from '../../../../shared/components/card/stat-card.component';

@Component({
    selector: 'app-dashboard-overview',
    imports: [CommonModule, RouterLink, SpinnerComponent, StatCardComponent],
    template: `
    <div class="mb-6">
      <h1 class="font-display text-display-sm font-semibold text-gray-900">
        {{ greeting() }}, {{ firstName() }} 👋
      </h1>
      <p class="mt-1 text-sm text-gray-500">Here's what's happening at VoiceMed Pro today.</p>
    </div>

    @if (canSeeAnalytics()) {
      @if (loading()) {
        <app-spinner />
      } @else {
        @if (stats(); as s) {
          <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <app-stat-card label="Total patients" [value]="s.overview.totalPatients" [delta]="s.overview.patientGrowth" />
            <app-stat-card label="Today's appointments" [value]="s.overview.todayAppointments" />
            <app-stat-card label="Patients waiting" [value]="s.overview.waitingPatients" />
            <app-stat-card label="Revenue" [value]="s.overview.totalRevenue | currency" [delta]="s.overview.revenueGrowth" />
          </div>
        }
      }
    }

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      @for (item of quickLinks(); track item.path) {
        <a
          [routerLink]="item.path"
          class="card flex items-center gap-4 p-5 transition-shadow duration-fast hover:shadow-md"
        >
          <span class="text-2xl">{{ item.icon }}</span>
          <div>
            <p class="font-medium text-gray-900">{{ item.label }}</p>
            <p class="text-xs text-gray-500">{{ item.description }}</p>
          </div>
        </a>
      }
    </div>
  `
})
export class DashboardOverviewComponent implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private navService = inject(NavService);

  stats = signal<DashboardStats | null>(null);
  loading = signal(true);

  firstName = () => this.authService.currentUser()?.firstName ?? '';
  canSeeAnalytics = () => ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'].includes(this.authService.role() ?? '');

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  quickLinks(): { label: string; description: string; icon: string; path: string }[] {
    const role = this.authService.role();
    const all = [
      { label: 'Patients', description: 'Search and manage records', icon: '🧑‍⚕️', path: '/patients', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
      { label: 'Book appointment', description: 'Schedule a visit', icon: '📅', path: '/appointments/new', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
      { label: 'Live queue', description: 'See who is waiting', icon: '🪑', path: '/appointments/queue', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
      { label: 'Medical records', description: 'Review patient EMR', icon: '📋', path: '/emr', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'] },
      { label: 'Billing', description: 'Invoices and payments', icon: '💳', path: '/billing', roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'PATIENT'] },
      { label: 'Analytics', description: 'Performance dashboards', icon: '📊', path: '/analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
    ];
    return all.filter((item) => !role || item.roles.includes(role));
  }

  ngOnInit(): void {
    if (!this.canSeeAnalytics()) {
      this.loading.set(false);
      return;
    }
    this.analyticsService.getDashboard().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
