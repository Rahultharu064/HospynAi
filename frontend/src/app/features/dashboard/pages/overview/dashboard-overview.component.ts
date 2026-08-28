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
    <div class="mb-8 rounded-3xl bg-navy-950 bg-console-grid bg-[length:40px_40px] p-6 text-white shadow-xl relative overflow-hidden sm:p-10 border border-navy-800">
      <div class="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 rounded-full bg-teal-500/20 blur-[80px]"></div>
      <div class="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-500/20 blur-[80px]"></div>
      
      <div class="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="font-display text-display-md font-semibold text-white tracking-tight">
            {{ greeting() }}, {{ firstName() }} 👋
          </h1>
          <p class="mt-2 text-navy-200 text-lg flex items-center gap-2">
            Here's your operational overview
            <span class="text-navy-600">·</span>
            <span class="font-medium text-teal-300">{{ today() }}</span>
          </p>
        </div>
        <span class="inline-flex w-fit items-center gap-2 rounded-full border border-navy-700 bg-navy-900/80 backdrop-blur-md px-4 py-2 text-xs font-mono uppercase tracking-widest text-teal-300 shadow-glow-teal">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
          </span>
          {{ roleLabel() }}
        </span>
      </div>
    </div>

    @if (canSeeAnalytics()) {
      <div class="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" appScrollReveal [revealDelay]="0">
        @if (loadingStats()) {
          @for (i of statSkeletons; track i) {
            <div class="card animate-pulse p-6">
              <div class="h-4 w-24 rounded bg-gray-100"></div>
              <div class="mt-4 h-8 w-20 rounded bg-gray-100"></div>
              <div class="mt-4 h-4 w-32 rounded bg-gray-100"></div>
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
          <div class="card col-span-full p-8 text-center text-sm text-gray-500 border-dashed border-2 bg-gray-50/50">
            <span class="text-2xl mb-2 block">📡</span>
            Couldn't load telemetry data. Try refreshing the view.
          </div>
        }
      </div>
    }

    @if (canSeeSchedule()) {
      <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3" appScrollReveal [revealDelay]="80">
        <div class="lg:col-span-2">
          <app-today-schedule [appointments]="todayAppointments()" [loading]="loadingSchedule()" />
        </div>
        @if (canSeeAnalytics()) {
          <app-weekly-snapshot [data]="stats()?.appointments ?? null" [loading]="loadingStats()" />
        }
      </div>
    }

    @if (isPatient()) {
      <div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3" appScrollReveal [revealDelay]="80">
        <div class="lg:col-span-2 card p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-moderate">
          <div class="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 class="font-display text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
              <p class="text-sm text-gray-500 mt-1">Your scheduled clinical visits</p>
            </div>
            <a routerLink="/appointments/new" class="btn-primary text-xs py-2 px-4 shadow-sm hover:shadow-md transition-all group">
              <span class="group-hover:scale-110 transition-transform">📅</span> Book New
            </a>
          </div>
          
          <div class="flex-1">
            @if (loadingSchedule()) {
              <ul class="space-y-4" aria-hidden="true">
                @for (i of [1,2]; track i) {
                  <li class="flex items-center gap-4 animate-pulse">
                    <div class="h-12 w-16 shrink-0 rounded-lg bg-gray-100"></div>
                    <div class="h-12 flex-1 rounded-lg bg-gray-100"></div>
                  </li>
                }
              </ul>
            } @else if (todayAppointments().length === 0) {
              <app-empty-state icon="🗓️" title="No upcoming visits" description="You have no scheduled appointments at this time." />
            } @else {
              <ul class="divide-y divide-gray-100">
                @for (apt of todayAppointments(); track apt.id) {
                  <li class="group flex items-center gap-4 rounded-xl px-2 py-3 hover:bg-gray-50 transition-colors duration-fast">
                    <div class="w-20 shrink-0 text-center flex flex-col items-center bg-white border border-gray-100 rounded-lg py-2 shadow-sm group-hover:border-navy-200 transition-colors">
                      <p class="font-mono text-xs font-semibold text-navy-700">{{ apt.appointmentDate | date:'MMM d' }}</p>
                      <p class="font-mono text-[10px] text-gray-500 mt-0.5">{{ apt.startTime }}</p>
                    </div>
                    <div class="h-10 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-teal-400 to-navy-500"></div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-base font-semibold text-gray-900">Dr. {{ apt.doctor.firstName }} {{ apt.doctor.lastName }}</p>
                      <p class="truncate text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span class="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                        {{ apt.doctor.specialization || 'General Consultation' }} · {{ apt.type }}
                      </p>
                    </div>
                    <app-badge [status]="apt.status" class="scale-95 group-hover:scale-100 transition-transform" />
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="card p-8 bg-gradient-to-br from-navy-950 via-navy-900 to-indigo-950 text-white flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-xl border-navy-800 hover:border-teal-500/50 transition-all duration-slower">
          <div class="absolute inset-0 bg-console-grid opacity-30 pointer-events-none mix-blend-overlay"></div>
          <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-teal-500/20 blur-3xl group-hover:bg-teal-400/30 transition-colors duration-slower pointer-events-none"></div>
          
          <div class="relative z-10 w-full flex flex-col items-center">
            <div class="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-6 backdrop-blur-md shadow-glow-indigo border border-white/10 group-hover:scale-110 transition-transform duration-moderate">
              🏥
            </div>
            <h3 class="font-display font-semibold text-2xl mb-3 text-white tracking-tight">Health Passport</h3>
            <p class="text-sm text-navy-200 mb-8 max-w-[250px] leading-relaxed">Secure, blockchain-anchored access to your medical history and clinical records.</p>
            <a routerLink="/emr" class="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-semibold text-navy-950 shadow-glow-teal transition-all duration-moderate hover:bg-teal-300 hover:scale-[1.02] active:scale-95">
              Access Vault
              <span class="font-mono" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    }

    @if (!canSeeAnalytics() && !canSeeSchedule() && !isPatient()) {
      <div class="card mb-8 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm">
        <div>
          <p class="font-display text-xl font-semibold text-gray-900">Unified System Console</p>
          <p class="mt-2 text-sm text-gray-500 max-w-lg">Access operational modules, clinical records, and analytics through the shortcuts below.</p>
        </div>
        <div class="h-16 w-16 rounded-full bg-navy-50 flex items-center justify-center text-3xl shadow-inner border border-navy-100">
          ⚙️
        </div>
      </div>
    }

    <div class="mt-2 pb-8">
      <h2 class="mb-5 text-xs font-mono font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
        System Modules
        <div class="h-px flex-1 bg-gray-200"></div>
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" appScrollReveal [revealDelay]="160">
        @for (item of quickLinks(); track item.path) {
          <a
            [routerLink]="item.path"
            class="card group relative flex items-center gap-4 p-5 overflow-hidden transition-all duration-moderate ease-default hover:-translate-y-1 hover:border-navy-300 hover:shadow-lg bg-white"
          >
            <div class="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-500/0 blur-xl group-hover:bg-teal-500/10 transition-colors duration-moderate pointer-events-none"></div>
            
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-2xl transition-all duration-moderate group-hover:bg-navy-50 group-hover:border-navy-200 group-hover:scale-110 group-hover:shadow-sm">
              {{ item.icon }}
            </div>
            <div class="min-w-0 flex-1 relative z-10">
              <p class="font-display font-semibold text-gray-900 group-hover:text-navy-700 transition-colors">{{ item.label }}</p>
              <p class="truncate text-xs text-gray-500 mt-1">{{ item.description }}</p>
            </div>
            <span class="relative z-10 shrink-0 text-gray-300 transition-all duration-moderate group-hover:translate-x-1 group-hover:text-teal-500" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
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

