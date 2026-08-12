import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { PatientService } from '../../services/patient.service';
import { PatientResponse, PatientStatus } from '../../models/patient.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-patient-list',
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
    <app-page-header title="Patients" subtitle="Search, register, and manage patient records.">
      @if (canManage()) {
        <a routerLink="/patients/new" class="btn-primary">+ New patient</a>
      }
    </app-page-header>

    <div class="card">
      <div class="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search by name, email, phone, or patient ID…"
          class="input sm:max-w-sm"
          (input)="onSearch($event)"
        />
        <select class="input sm:max-w-xs" (change)="onStatusChange($event)">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DECEASED">Deceased</option>
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (patients().length === 0) {
        <app-empty-state icon="🧑‍⚕️" title="No patients found" description="Try adjusting your search or filters.">
          @if (canManage()) {
            <a routerLink="/patients/new" class="btn-primary">Register a patient</a>
          }
        </app-empty-state>
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Patient</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Age / Gender</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last visit</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              @for (p of patients(); track p.id) {
                <tr class="hover:bg-gray-50">
                  <td class="whitespace-nowrap px-4 py-3">
                    <a [routerLink]="['/patients', p.id]" class="font-medium text-navy-600 hover:underline">
                      {{ p.firstName }} {{ p.lastName }}
                    </a>
                    <p class="text-xs text-gray-400">{{ p.patientId }}</p>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    <p>{{ p.email || '—' }}</p>
                    <p class="text-gray-400">{{ p.phone || '—' }}</p>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {{ p.age ?? '—' }} @if (p.gender) { · {{ p.gender | titlecase }} }
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <app-badge [status]="p.status" />
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {{ p.lastVisitDate ? (p.lastVisitDate | date: 'mediumDate') : 'No visits yet' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <a [routerLink]="['/patients', p.id]" class="font-medium text-navy-500 hover:text-navy-600">View →</a>
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
export class PatientListComponent implements OnInit, OnDestroy {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  patients = signal<PatientResponse[]>([]);
  pagination = signal<Pagination | null>(null);
  loading = signal(true);

  private page = 1;
  private search = '';
  private status: PatientStatus | '' = '';

  canManage = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(this.authService.role() ?? '');

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe((term) => {
      this.search = term;
      this.page = 1;
      this.fetch();
    });
    this.fetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event): void {
    this.status = (event.target as HTMLSelectElement).value as PatientStatus | '';
    this.page = 1;
    this.fetch();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.fetch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private fetch(): void {
    this.loading.set(true);
    this.patientService
      .list({
        page: this.page,
        limit: 20,
        search: this.search || undefined,
        status: this.status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (res) => {
          this.patients.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
