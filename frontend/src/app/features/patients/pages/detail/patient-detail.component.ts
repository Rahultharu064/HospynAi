import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { PatientDocumentResponse, PatientResponse } from '../../models/patient.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, SpinnerComponent, BadgeComponent, EmptyStateComponent],
  template: `
    @if (loading()) {
      <app-spinner />
    } @else {
    @if (patient(); as p) {
      <app-page-header [title]="p.firstName + ' ' + p.lastName" [subtitle]="p.patientId">
        <a [routerLink]="['/appointments/new']" [queryParams]="{ patientId: p.id }" class="btn-secondary">
          Book appointment
        </a>
        @if (canManage()) {
          <a [routerLink]="['/patients', p.id, 'edit']" class="btn-secondary">Edit</a>
          <button type="button" class="btn-danger" (click)="deletePatient()">Delete</button>
        }
      </app-page-header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card space-y-4 p-6 lg:col-span-2">
          <div class="flex items-center justify-between">
            <h2 class="font-display text-base font-semibold text-gray-900">Overview</h2>
            <app-badge [status]="p.status" />
          </div>

          <dl class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-gray-500">Email</dt>
              <dd class="font-medium text-gray-900">{{ p.email || '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Phone</dt>
              <dd class="font-medium text-gray-900">{{ p.phone || '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Age / Gender</dt>
              <dd class="font-medium text-gray-900">{{ p.age ?? '—' }} · {{ p.gender || '—' }}</dd>
            </div>
            <div>
              <dt class="text-gray-500">Blood group</dt>
              <dd class="font-medium text-gray-900">{{ p.bloodGroup?.replace('_', ' ') || '—' }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-gray-500">Address</dt>
              <dd class="font-medium text-gray-900">{{ formatAddress(p) }}</dd>
            </div>
            <div class="col-span-2">
              <dt class="text-gray-500">Primary doctor</dt>
              <dd class="font-medium text-gray-900">
                {{ p.primaryDoctor ? 'Dr. ' + p.primaryDoctor.firstName + ' ' + p.primaryDoctor.lastName : 'Unassigned' }}
              </dd>
            </div>
          </dl>

          <div class="border-t border-gray-200 pt-4">
            <h3 class="mb-2 text-sm font-semibold text-gray-700">Allergies</h3>
            @if (p.allergies.length) {
              <div class="flex flex-wrap gap-2">
                @for (a of p.allergies; track a) {
                  <span class="badge bg-danger-100 text-danger-700">{{ a }}</span>
                }
              </div>
            } @else {
              <p class="text-sm text-gray-400">No known allergies.</p>
            }
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h3 class="mb-2 text-sm font-semibold text-gray-700">Chronic conditions</h3>
            @if (p.chronicConditions.length) {
              <div class="flex flex-wrap gap-2">
                @for (c of p.chronicConditions; track c) {
                  <span class="badge bg-warning-100 text-warning-700">{{ c }}</span>
                }
              </div>
            } @else {
              <p class="text-sm text-gray-400">None recorded.</p>
            }
          </div>

          @if (p.notes) {
            <div class="border-t border-gray-200 pt-4">
              <h3 class="mb-2 text-sm font-semibold text-gray-700">Notes</h3>
              <p class="whitespace-pre-line text-sm text-gray-600">{{ p.notes }}</p>
            </div>
          }
        </div>

        <div class="space-y-6">
          <div class="card p-6">
            <h2 class="mb-3 font-display text-base font-semibold text-gray-900">Activity</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Total visits</dt>
                <dd class="font-medium text-gray-900">{{ p.totalVisits }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Last visit</dt>
                <dd class="font-medium text-gray-900">{{ p.lastVisitDate ? (p.lastVisitDate | date: 'mediumDate') : '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Registered</dt>
                <dd class="font-medium text-gray-900">{{ p.createdAt | date: 'mediumDate' }}</dd>
              </div>
            </dl>
          </div>

          <div class="card p-6">
            <div class="mb-3 flex items-center justify-between">
              <h2 class="font-display text-base font-semibold text-gray-900">Documents</h2>
            </div>
            @if (documents().length === 0) {
              <p class="text-sm text-gray-400">No documents uploaded yet.</p>
            } @else {
              <ul class="space-y-2">
                @for (doc of documents(); track doc.id) {
                  <li>
                    <a [href]="doc.url" target="_blank" rel="noopener" class="flex items-center justify-between text-sm hover:text-navy-600">
                      <span class="truncate">{{ doc.title }}</span>
                      <span class="shrink-0 text-xs text-gray-400">{{ doc.documentType | titlecase }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </div>
    } @else {
      <app-empty-state icon="🔍" title="Patient not found" description="This patient may have been removed.">
        <a routerLink="/patients" class="btn-primary">Back to patients</a>
      </app-empty-state>
    }
    }
  `,
})
export class PatientDetailComponent implements OnInit {
  private patientService = inject(PatientService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  patient = signal<PatientResponse | null>(null);
  documents = signal<PatientDocumentResponse[]>([]);
  loading = signal(true);

  canManage = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(this.authService.role() ?? '');

  formatAddress(p: PatientResponse): string {
    return [p.address, p.city, p.state, p.country, p.zipCode].filter(Boolean).join(', ') || '—';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.patientService.getById(id).subscribe({
      next: (res) => {
        this.patient.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.patientService.getDocuments(id).subscribe({
      next: (res) => this.documents.set(res.data),
    });
  }

  deletePatient(): void {
    const p = this.patient();
    if (!p || !confirm(`Remove ${p.firstName} ${p.lastName} from active patients?`)) return;

    this.patientService.delete(p.id).subscribe({
      next: () => {
        this.toast.success('Patient removed.');
        this.router.navigate(['/patients']);
      },
    });
  }
}
