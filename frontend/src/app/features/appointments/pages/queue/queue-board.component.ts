import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { Subscription, interval, startWith, switchMap } from 'rxjs';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentResponse } from '../../models/appointment.model';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-queue-board',
    imports: [PageHeaderComponent, SpinnerComponent, EmptyStateComponent, BadgeComponent],
    template: `
    <app-page-header title="Live queue" subtitle="Auto-refreshes every 15 seconds." />

    @if (loading()) {
      <app-spinner />
    } @else if (queue().length === 0) {
      <app-empty-state icon="🪑" title="Queue is empty" description="Walk-in and scheduled patients will appear here." />
    } @else {
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (a of queue(); track a.id) {
          <div class="card p-5">
            <div class="mb-3 flex items-start justify-between">
              <div>
                <p class="font-display text-lg font-semibold text-navy-500">
                  {{ a.queueToken || '#' + a.queuePosition }}
                </p>
                <p class="text-sm text-gray-500">Dr. {{ a.doctor.firstName }} {{ a.doctor.lastName }}</p>
              </div>
              <app-badge [status]="a.status" />
            </div>
            <p class="font-medium text-gray-900">{{ a.patient.firstName }} {{ a.patient.lastName }}</p>
            @if (a.estimatedWait !== null) {
              <p class="mt-1 text-xs text-gray-400">~{{ a.estimatedWait }} min wait</p>
            }
            <button type="button" class="btn-secondary mt-3 w-full" (click)="callNext(a.doctor.id)">
              Call next for this doctor
            </button>
          </div>
        }
      </div>
    }
  `
})
export class QueueBoardComponent implements OnInit, OnDestroy {
  private appointmentService = inject(AppointmentService);
  private toast = inject(ToastService);
  private sub?: Subscription;

  queue = signal<AppointmentResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.sub = interval(15000)
      .pipe(
        startWith(0),
        switchMap(() => this.appointmentService.getLiveQueue())
      )
      .subscribe({
        next: (res) => {
          this.queue.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  callNext(doctorId: string): void {
    this.appointmentService.callNext(doctorId).subscribe({
      next: (res) => {
        if (res.data) {
          this.toast.success(`Now calling ${res.data.patient.firstName} ${res.data.patient.lastName}.`);
        } else {
          this.toast.info('No patients waiting for this doctor.');
        }
      },
    });
  }
}
