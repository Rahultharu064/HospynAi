import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppointmentResponse, AppointmentType } from '../../appointments/models/appointment.model';

const TYPE_ICON: Record<AppointmentType, string> = {
  IN_PERSON: '🏥',
  TELEMEDICINE: '💻',
  WALK_IN: '🚶',
  EMERGENCY: '🚨',
  FOLLOW_UP: '🔁',
};

@Component({
  selector: 'app-today-schedule',
  standalone: true,
  imports: [RouterLink, BadgeComponent, EmptyStateComponent],
  template: `
    <div class="card flex h-full flex-col p-5">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-base font-semibold text-gray-900">Today's schedule</h2>
          <p class="text-xs text-gray-500">{{ appointments.length }} appointment{{ appointments.length === 1 ? '' : 's' }} today</p>
        </div>
        <a routerLink="/appointments" class="text-xs font-semibold text-navy-600 hover:text-navy-700">View all →</a>
      </div>

      <div class="mt-4 flex-1">
        @if (loading) {
          <ul class="space-y-3" aria-hidden="true">
            @for (i of skeletonRows; track i) {
              <li class="flex items-center gap-3 animate-pulse">
                <div class="h-10 w-14 shrink-0 rounded-md bg-gray-100"></div>
                <div class="h-10 flex-1 rounded-md bg-gray-100"></div>
              </li>
            }
          </ul>
        } @else if (appointments.length === 0) {
          <app-empty-state icon="🗓️" title="Nothing scheduled" description="Today's calendar is clear so far." />
        } @else {
          <ul class="divide-y divide-gray-100">
            @for (apt of appointments; track apt.id) {
              <li class="flex items-center gap-3 rounded-md px-1.5 py-2.5">
                <div class="w-14 shrink-0 text-center">
                  <p class="font-mono text-xs font-semibold text-gray-700">{{ apt.startTime }}</p>
                </div>
                <div
                  class="h-8 w-0.5 shrink-0 rounded-full"
                  [class]="statusBarClass(apt.status)"
                ></div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900">
                    {{ apt.patient.firstName }} {{ apt.patient.lastName }}
                  </p>
                  <p class="truncate text-xs text-gray-500">
                    {{ typeIcon(apt.type) }} Dr. {{ apt.doctor.firstName }} {{ apt.doctor.lastName }}
                    @if (apt.doctor.specialization) { · {{ apt.doctor.specialization }} }
                  </p>
                </div>
                <app-badge [status]="apt.status" />
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class TodayScheduleComponent {
  @Input() appointments: AppointmentResponse[] = [];
  @Input() loading = false;

  readonly skeletonRows = [1, 2, 3, 4];

  typeIcon(type: AppointmentType): string {
    return TYPE_ICON[type] ?? '📌';
  }

  statusBarClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'bg-success-500',
      SCHEDULED: 'bg-navy-400',
      IN_PROGRESS: 'bg-warning-500',
      COMPLETED: 'bg-gray-300',
      CANCELLED: 'bg-danger-500',
      NO_SHOW: 'bg-danger-500',
      RESCHEDULED: 'bg-indigo-400',
    };
    return map[status] ?? 'bg-gray-200';
  }
}
