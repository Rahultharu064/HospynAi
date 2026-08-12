import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse, AppointmentStatus } from '../../models/appointment.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    SpinnerComponent,
    EmptyStateComponent,
    BadgeComponent,
    PaginationComponent,
  ],
  template: `
    <app-page-header title="Appointments" subtitle="Manage bookings, reschedules, and cancellations.">
      <a routerLink="/appointments/queue" class="btn-secondary">Live queue</a>
      @if (canBook()) {
        <a routerLink="/appointments/new" class="btn-primary">+ Book appointment</a>
      }
    </app-page-header>

    <div class="card">
      <div class="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <input type="date" class="input sm:max-w-xs" (change)="onDateChange($event)" />
        <select class="input sm:max-w-xs" (change)="onStatusChange($event)">
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s.replace('_', ' ') }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (appointments().length === 0) {
        <app-empty-state icon="📅" title="No appointments found" description="Try a different date or status filter." />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Patient</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Doctor</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date / Time</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              @for (a of appointments(); track a.id) {
                <tr class="hover:bg-gray-50">
                  <td class="whitespace-nowrap px-4 py-3">
                    <a [routerLink]="['/patients', a.patient.id]" class="font-medium text-navy-600 hover:underline">
                      {{ a.patient.firstName }} {{ a.patient.lastName }}
                    </a>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    Dr. {{ a.doctor.firstName }} {{ a.doctor.lastName }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {{ a.appointmentDate | date: 'mediumDate' }} · {{ a.startTime }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ a.type.replace('_', ' ') }}</td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <app-badge [status]="a.status" />
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
                    @if (canTransition() && !isFinal(a.status)) {
                      <div class="flex justify-end gap-2">
                        @if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') {
                          <button type="button" class="text-success-600 hover:underline" (click)="complete(a)">Complete</button>
                          <button type="button" class="text-warning-600 hover:underline" (click)="noShow(a)">No-show</button>
                        }
                        <button type="button" class="text-danger-600 hover:underline" (click)="cancel(a)">Cancel</button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination [data]="pagination()" (pageChange)="onPageChange($event)" />
      }
    </div>
  `,
})
export class AppointmentListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  statuses: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  appointments = signal<AppointmentResponse[]>([]);
  pagination = signal<Pagination | null>(null);
  loading = signal(true);

  private page = 1;
  private date = '';
  private status = '';

  canBook = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT'].includes(this.authService.role() ?? '');
  canTransition = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'].includes(this.authService.role() ?? '');
  isFinal = (status: AppointmentStatus) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);

  ngOnInit(): void {
    this.fetch();
  }

  onDateChange(event: Event): void {
    this.date = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.fetch();
  }

  onStatusChange(event: Event): void {
    this.status = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.fetch();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.fetch();
  }

  complete(a: AppointmentResponse): void {
    this.appointmentService.complete(a.id).subscribe({
      next: () => {
        this.toast.success('Appointment marked complete.');
        this.fetch();
      },
    });
  }

  noShow(a: AppointmentResponse): void {
    this.appointmentService.markNoShow(a.id).subscribe({
      next: () => {
        this.toast.success('Marked as no-show.');
        this.fetch();
      },
    });
  }

  cancel(a: AppointmentResponse): void {
    const reason = prompt('Reason for cancellation:');
    if (!reason) return;
    this.appointmentService.cancel(a.id, reason).subscribe({
      next: () => {
        this.toast.success('Appointment cancelled.');
        this.fetch();
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.appointmentService
      .list({
        page: this.page,
        limit: 20,
        dateFrom: this.date || undefined,
        dateTo: this.date || undefined,
        status: (this.status as AppointmentStatus) || undefined,
        sortBy: 'appointmentDate',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (res) => {
          this.appointments.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
