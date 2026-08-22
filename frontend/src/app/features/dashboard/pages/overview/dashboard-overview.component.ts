import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { AnalyticsService } from '../../../analytics/services/analytics.service';
import { DashboardStats } from '../../../analytics/models/analytics.model';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { AppointmentResponse } from '../../../appointments/models/appointment.model';
import { NavService } from '../../../../core/services/nav.service';
import { StatCardComponent } from '../../../../shared/components/card/stat-card.component';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { TodayScheduleComponent } from '../../components/today-schedule.component';
import { WeeklySnapshotComponent } from '../../components/weekly-snapshot.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

const ANALYTICS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'];
const SCHEDULE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    TodayScheduleComponent,
    WeeklySnapshotComponent,
    ScrollRevealDirective,
    BadgeComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="font-display text-display-sm font-semibold text-gray-900">
          {{ greeting() }}, {{ firstName() }} 👋
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          Here's what's happening at HospynAI today
          <span class="mx-1 text-gray-300">·</span>
          <span class="font-medium text-gray-600">{{ today() }}</span>
        </p>
      </div>
      <span class="inline-flex w-fit items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
        <span class="h-1.5 w-1.5 rounded-full bg-success-500"></span>
        {{ roleLabel() }}
      </span>
    </div>

    @if (canSeeAnalytics()) {
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" appScrollReveal [revealDelay]="0">
        @if (loadingStats()) {
          @for (i of statSkeletons; track i) {
            <div class="card animate-pulse p-5">
              <div class="h-3 w-20 rounded bg-gray-100"></div>
              <div class="mt-3 h-7 w-16 rounded bg-gray-100"></div>
              <div class="mt-3 h-4 w-24 rounded bg-gray-100"></div>
            </div>
          }
        } @else if (stats(); as s) {
          <app-stat-card
            label="Total patients"
            icon="🧑‍⚕️"
            tone="navy"
            [numericValue]="s.overview.totalPatients"
            [delta]="s.overview.patientGrowth"
          />
          <app-stat-card
            label="Today's appointments"
            icon="📅"
            tone="teal"
            [numericValue]="s.overview.todayAppointments"
          />
          <app-stat-card
            label="Patients waiting"
            icon="🪑"
            tone="warning"
            [numericValue]="s.overview.waitingPatients"
          />
          <app-stat-card
            label="Revenue"
            icon="💰"
            tone="success"
            [numericValue]="s.overview.totalRevenue"
            prefix="$"
            [delta]="s.overview.revenueGrowth"
          />
        } @else {
          <div class="card col-span-full p-5 text-center text-sm text-gray-500">
            Couldn't load today's numbers. Try refreshing the page.
          </div>
        }
      </div>
    }

    @if (canSeeSchedule()) {
      <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3" appScrollReveal [revealDelay]="80">
        <div class="lg:col-span-2">
          <app-today-schedule [appointments]="todayAppointments()" [loading]="loadingSchedule()" />
        </div>
        @if (canSeeAnalytics()) {
          <app-weekly-snapshot [data]="stats()?.appointments ?? null" [loading]="loadingStats()" />
        }
      </div>
    }

    @if (isPatient()) {
      <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3" appScrollReveal [revealDelay]="80">
        <div class="lg:col-span-2 card p-5 flex flex-col h-full">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="font-display text-base font-semibold text-gray-900">Upcoming Appointments</h2>
              <p class="text-xs text-gray-500">Your scheduled visits</p>
            </div>
            <a routerLink="/appointments/new" class="text-xs font-semibold text-navy-600 hover:text-navy-700">+ Book New</a>
          </div>
          
          <div class="flex-1">
            @if (loadingSchedule()) {
              <ul class="space-y-3" aria-hidden="true">
                @for (i of [1,2]; track i) {
                  <li class="flex items-center gap-3 animate-pulse">
                    <div class="h-10 w-14 shrink-0 rounded-md bg-gray-100"></div>
                    <div class="h-10 flex-1 rounded-md bg-gray-100"></div>
                  </li>
                }
              </ul>
            } @else if (todayAppointments().length === 0) {
              <app-empty-state icon="🗓️" title="No upcoming visits" description="You have no scheduled appointments at this time." />
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (apt of todayAppointments(); track apt.id) {
                  <li class="flex items-center gap-3 rounded-md px-1.5 py-2.5">
                    <div class="w-20 shrink-0 text-center flex flex-col items-center">
                      <p class="font-mono text-xs font-semibold text-gray-700">{{ apt.date | date:'MMM d' }}</p>
                      <p class="font-mono text-[10px] text-gray-500">{{ apt.startTime }}</p>
                    </div>
                    <div class="h-8 w-0.5 shrink-0 rounded-full bg-navy-400"></div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-900">Dr. {{ apt.doctor.firstName }} {{ apt.doctor.lastName }}</p>
                      <p class="truncate text-xs text-gray-500">{{ apt.doctor.specialization || 'General Consultation' }} · {{ apt.type }}</p>
                    </div>
                    <app-badge [status]="apt.status" />
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="card p-5 bg-gradient-to-br from-navy-600 to-navy-800 text-white flex flex-col justify-center items-center text-center">
          <div class="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-2xl mb-4 backdrop-blur-sm">
            🛡️
          </div>
          <h3 class="font-display font-semibold text-lg mb-2">Health Passport</h3>
          <p class="text-sm text-navy-100 mb-6">Access your digital medical records, lab results, and prescriptions.</p>
          <a routerLink="/emr" class="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm transition-colors hover:bg-gray-50">
            View My Records
          </a>
        </div>
      </div>
    }

    @if (!canSeeAnalytics() && !canSeeSchedule() && !isPatient()) {
      <div class="card mb-6 flex flex-col items-start gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-display text-base font-semibold text-gray-900">Everything in one place</p>
          <p class="mt-1 text-sm text-gray-500">Use the shortcuts below to navigate through the system.</p>
        </div>
        <span class="text-3xl">🩺</span>
      </div>
    }

    <div>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" appScrollReveal [revealDelay]="160">
        @for (item of quickLinks(); track item.path) {
          <a
            [routerLink]="item.path"
            class="card group flex items-center gap-4 p-5 transition-all duration-moderate ease-default hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
          >
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xl transition-colors duration-fast group-hover:bg-navy-50">
              {{ item.icon }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">{{ item.label }}</p>
              <p class="truncate text-xs text-gray-500">{{ item.description }}</p>
            </div>
            <span class="shrink-0 text-gray-300 transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-navy-500" aria-hidden="true">→</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class DashboardOverviewComponent implements OnInit {
  private authService = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private appointmentService = inject(AppointmentService);
  private navService = inject(NavService);

  stats = signal<DashboardStats | null>(null);
  loadingStats = signal(true);

  todayAppointments = signal<AppointmentResponse[]>([]);
  loadingSchedule = signal(true);

  readonly statSkeletons = [1, 2, 3, 4];

  firstName = () => this.authService.currentUser()?.firstName ?? '';
  canSeeAnalytics = () => ANALYTICS_ROLES.includes(this.authService.role() ?? '');
  canSeeSchedule = () => SCHEDULE_ROLES.includes(this.authService.role() ?? '');
  isPatient = () => this.authService.role() === 'PATIENT';

  roleLabel(): string {
    const role = this.authService.role();
    return role ? role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  today(): string {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  quickLinks(): { label: string; description: string; icon: string; path: string }[] {
    const role = this.authService.role();
    const all = [
      { label: 'Patients', description: 'Search and manage records', icon: '🧑‍⚕️', path: '/patients', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
      { label: 'Book appointment', description: 'Schedule a visit', icon: '📅', path: '/appointments/new', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
      { label: 'Live queue', description: 'See who is waiting', icon: '🪑', path: '/appointments/queue', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
      { label: 'My Records', description: 'Review your medical history', icon: '📋', path: '/emr', roles: ['PATIENT'] },
      { label: 'Medical records', description: 'Review patient EMR', icon: '📋', path: '/emr', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'] },
      { label: 'Billing', description: 'Invoices and payments', icon: '💳', path: '/billing', roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'PATIENT'] },
      { label: 'Analytics', description: 'Performance dashboards', icon: '📊', path: '/analytics', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
    ];
    return all.filter((item) => !role || item.roles.includes(role));
  }

  ngOnInit(): void {
    if (this.canSeeAnalytics()) {
      this.analyticsService.getDashboard().subscribe({
        next: (res) => {
          this.stats.set(res.data);
          this.loadingStats.set(false);
        },
        error: () => this.loadingStats.set(false),
      });
    } else {
      this.loadingStats.set(false);
    }

    if (this.canSeeSchedule()) {
      const todayStr = new Date().toISOString().slice(0, 10);
      this.appointmentService
        .list({ dateFrom: todayStr, dateTo: todayStr, sortBy: 'startTime', sortOrder: 'asc', limit: 6 })
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          this.todayAppointments.set(res?.data ?? []);
          this.loadingSchedule.set(false);
        });
    } else if (this.isPatient()) {
      const todayStr = new Date().toISOString().slice(0, 10);
      this.appointmentService
        .list({ dateFrom: todayStr, sortBy: 'date', sortOrder: 'asc', limit: 5 })
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          this.todayAppointments.set(res?.data ?? []);
          this.loadingSchedule.set(false);
        });
    } else {
      this.loadingSchedule.set(false);
    }
  }
}

