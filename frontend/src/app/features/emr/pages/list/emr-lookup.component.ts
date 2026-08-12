import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmrService } from '../../services/emr.service';
import { EMRResponse } from '../../models/emr.model';
import { PatientService } from '../../../patients/services/patient.service';
import { PatientResponse } from '../../../patients/models/patient.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-emr-lookup',
    imports: [CommonModule, RouterLink, PageHeaderComponent, SpinnerComponent, EmptyStateComponent, BadgeComponent],
    template: `
    <app-page-header title="Medical Records" subtitle="Search for a patient to view their EMR history." />

    <div class="card p-4">
      <input
        type="search"
        class="input sm:max-w-md"
        placeholder="Search patient by name, email, or patient ID…"
        (input)="onSearch($event)"
      />
      @if (results().length > 0) {
        <ul class="mt-2 divide-y divide-gray-100">
          @for (p of results(); track p.id) {
            <li>
              <button
                type="button"
                class="block w-full px-2 py-2 text-left text-sm hover:bg-gray-50"
                (click)="selectPatient(p)"
              >
                {{ p.firstName }} {{ p.lastName }} <span class="text-gray-400">· {{ p.patientId }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </div>

    @if (selectedPatient(); as p) {
      <div class="card mt-6">
        <div class="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 class="font-display text-base font-semibold text-gray-900">
            {{ p.firstName }} {{ p.lastName }} — Medical History
          </h2>
          <a [routerLink]="['/emr/new']" [queryParams]="{ patientId: p.id }" class="btn-primary">
            + New record
          </a>
        </div>

        @if (loading()) {
          <app-spinner />
        } @else if (records().length === 0) {
          <app-empty-state icon="📋" title="No records yet" description="Create the first medical record for this patient." />
        } @else {
          <ul class="divide-y divide-gray-100">
            @for (r of records(); track r.id) {
              <li class="flex items-center justify-between p-4 hover:bg-gray-50">
                <a [routerLink]="['/emr', r.id]" class="min-w-0 flex-1">
                  <p class="font-medium text-navy-600">{{ r.diagnosis || r.chiefComplaint || 'Untitled visit' }}</p>
                  <p class="text-xs text-gray-400">
                    Dr. {{ r.doctor.firstName }} {{ r.doctor.lastName }} · {{ r.createdAt | date: 'medium' }}
                  </p>
                </a>
                <app-badge [status]="r.status" />
              </li>
            }
          </ul>
        }
      </div>
    }
  `
})
export class EmrLookupComponent {
  private patientService = inject(PatientService);
  private emrService = inject(EmrService);

  results = signal<PatientResponse[]>([]);
  selectedPatient = signal<PatientResponse | null>(null);
  records = signal<EMRResponse[]>([]);
  loading = signal(false);

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (term.length < 2) {
      this.results.set([]);
      return;
    }
    this.patientService.list({ search: term, limit: 8 }).subscribe({
      next: (res) => this.results.set(res.data),
    });
  }

  selectPatient(p: PatientResponse): void {
    this.selectedPatient.set(p);
    this.results.set([]);
    this.loading.set(true);
    this.emrService.getPatientHistory(p.id).subscribe({
      next: (res) => {
        this.records.set(res.records);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
