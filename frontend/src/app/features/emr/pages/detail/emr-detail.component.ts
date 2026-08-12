import { Component, OnInit, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmrService } from '../../services/emr.service';
import { EMRResponse } from '../../models/emr.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-emr-detail',
    imports: [ReactiveFormsModule, PageHeaderComponent, SpinnerComponent, BadgeComponent],
    template: `
    @if (loading()) {
      <app-spinner />
    } @else {
    @if (record(); as r) {
      <app-page-header [title]="r.diagnosis || r.chiefComplaint || 'Medical record'" [subtitle]="'v' + r.version + ' · ' + r.patient.firstName + ' ' + r.patient.lastName">
        <app-badge [status]="r.status" />
        @if (canSign() && r.status !== 'SIGNED') {
          <button type="button" class="btn-primary" (click)="sign()" [disabled]="signing()">
            {{ signing() ? 'Signing…' : 'Sign & finalize' }}
          </button>
        }
      </app-page-header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card space-y-4 p-6 lg:col-span-2">
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Chief complaint</h3>
            <p class="text-sm text-gray-600">{{ r.chiefComplaint || '—' }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Diagnosis</h3>
            <p class="text-sm text-gray-600">{{ r.diagnosis || '—' }}</p>
            @if (r.icd10Codes.length) {
              <div class="mt-1 flex flex-wrap gap-1">
                @for (code of r.icd10Codes; track code) {
                  <span class="badge bg-gray-100 text-gray-600">{{ code }}</span>
                }
              </div>
            }
          </div>

          @if (r.vitalSigns; as v) {
            <div>
              <h3 class="mb-1 text-sm font-semibold text-gray-700">Vital signs</h3>
              <dl class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                @if (v.temperature) { <div><dt class="text-gray-400">Temp</dt><dd>{{ v.temperature }}°C</dd></div> }
                @if (v.heartRate) { <div><dt class="text-gray-400">HR</dt><dd>{{ v.heartRate }} bpm</dd></div> }
                @if (v.bloodPressureSystolic) { <div><dt class="text-gray-400">BP</dt><dd>{{ v.bloodPressureSystolic }}/{{ v.bloodPressureDiastolic }}</dd></div> }
                @if (v.oxygenSaturation) { <div><dt class="text-gray-400">SpO2</dt><dd>{{ v.oxygenSaturation }}%</dd></div> }
                @if (v.bmi) { <div><dt class="text-gray-400">BMI</dt><dd>{{ v.bmi }}</dd></div> }
                @if (v.painLevel !== undefined) { <div><dt class="text-gray-400">Pain</dt><dd>{{ v.painLevel }}/10</dd></div> }
              </dl>
            </div>
          }

          <div>
            <h3 class="text-sm font-semibold text-gray-700">Examination notes</h3>
            <p class="whitespace-pre-line text-sm text-gray-600">{{ r.examinationNotes || '—' }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Treatment plan</h3>
            <p class="whitespace-pre-line text-sm text-gray-600">{{ r.treatmentPlan || '—' }}</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-5">
            <h3 class="mb-2 font-display text-sm font-semibold text-gray-900">Blockchain verification</h3>
            @if (r.blockchainRecords.length === 0) {
              <p class="text-sm text-gray-400">Not yet anchored.</p>
            } @else {
              @for (b of r.blockchainRecords; track b.id) {
                <div class="mb-2 rounded-md bg-indigo-50 p-2 text-xs text-indigo-700">
                  <p class="font-medium">{{ b.recordType }}</p>
                  <p class="truncate">{{ b.dataHash }}</p>
                  <app-badge [status]="b.status" />
                </div>
              }
            }
          </div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="card p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-display text-base font-semibold text-gray-900">Prescriptions</h3>
            @if (canPrescribe()) {
              <button type="button" class="text-sm font-medium text-navy-500 hover:text-navy-600" (click)="showRxForm.set(!showRxForm())">
                {{ showRxForm() ? 'Cancel' : '+ Add' }}
              </button>
            }
          </div>

          @if (showRxForm()) {
            <form [formGroup]="rxForm" (ngSubmit)="addPrescription(r.id, r.patient.id)" class="mb-4 space-y-2 rounded-md border border-gray-200 p-3">
              <div class="grid grid-cols-2 gap-2">
                <input class="input" placeholder="Drug name" formControlName="drugName" />
                <input class="input" placeholder="Dosage (e.g. 500mg)" formControlName="dosage" />
                <input class="input" placeholder="Frequency" formControlName="frequency" />
                <input class="input" placeholder="Duration" formControlName="duration" />
              </div>
              <button type="submit" class="btn-primary w-full" [disabled]="rxForm.invalid || savingRx()">
                {{ savingRx() ? 'Adding…' : 'Add prescription' }}
              </button>
            </form>
          }

          @if (r.prescriptions.length === 0) {
            <p class="text-sm text-gray-400">No prescriptions yet.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (rx of r.prescriptions; track rx.id) {
                <li class="py-2 text-sm">
                  <p class="font-medium text-gray-900">{{ rx.drugName }} · {{ rx.dosage }}</p>
                  <p class="text-gray-500">{{ rx.frequency }} for {{ rx.duration }}</p>
                </li>
              }
            </ul>
          }
        </div>

        <div class="card p-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-display text-base font-semibold text-gray-900">Lab reports</h3>
            @if (canOrderLabs()) {
              <button type="button" class="text-sm font-medium text-navy-500 hover:text-navy-600" (click)="showLabForm.set(!showLabForm())">
                {{ showLabForm() ? 'Cancel' : '+ Order' }}
              </button>
            }
          </div>

          @if (showLabForm()) {
            <form [formGroup]="labForm" (ngSubmit)="addLabReport(r.id, r.patient.id)" class="mb-4 space-y-2 rounded-md border border-gray-200 p-3">
              <input class="input" placeholder="Test name (e.g. CBC)" formControlName="testName" />
              <input class="input" placeholder="Notes / expected results" formControlName="notes" />
              <button type="submit" class="btn-primary w-full" [disabled]="labForm.invalid || savingLab()">
                {{ savingLab() ? 'Ordering…' : 'Order test' }}
              </button>
            </form>
          }

          @if (r.labReports.length === 0) {
            <p class="text-sm text-gray-400">No lab reports yet.</p>
          } @else {
            <ul class="divide-y divide-gray-100">
              @for (lab of r.labReports; track lab.id) {
                <li class="flex items-center justify-between py-2 text-sm">
                  <span class="font-medium text-gray-900">{{ lab.testName }}</span>
                  <app-badge [status]="lab.status" />
                </li>
              }
            </ul>
          }
        </div>
      </div>
    }
    }
  `
})
export class EmrDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private emrService = inject(EmrService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  record = signal<EMRResponse | null>(null);
  loading = signal(true);
  signing = signal(false);
  savingRx = signal(false);
  savingLab = signal(false);
  showRxForm = signal(false);
  showLabForm = signal(false);

  canSign = () => this.authService.role() === 'DOCTOR' || this.authService.role() === 'SUPER_ADMIN';
  canPrescribe = () => this.authService.role() === 'DOCTOR';
  canOrderLabs = () => ['DOCTOR', 'LAB_TECHNICIAN'].includes(this.authService.role() ?? '');

  rxForm = this.fb.nonNullable.group({
    drugName: ['', Validators.required],
    dosage: ['', Validators.required],
    frequency: ['', Validators.required],
    duration: ['', Validators.required],
  });

  labForm = this.fb.nonNullable.group({
    testName: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.emrService.getById(id).subscribe({
      next: (res) => {
        this.record.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sign(): void {
    const r = this.record();
    if (!r || !confirm('Signing finalizes this record and anchors it to the blockchain. Continue?')) return;

    this.signing.set(true);
    this.emrService.sign(r.id).subscribe({
      next: (res) => {
        this.record.set(res.data);
        this.signing.set(false);
        this.toast.success('Record signed and finalized.');
      },
      error: () => this.signing.set(false),
    });
  }

  addPrescription(medicalRecordId: string, patientId: string): void {
    if (this.rxForm.invalid) return;
    this.savingRx.set(true);
    this.emrService.createPrescription({ medicalRecordId, patientId, ...this.rxForm.getRawValue() }).subscribe({
      next: (res) => {
        this.record.update((r) => (r ? { ...r, prescriptions: [...r.prescriptions, res.data] } : r));
        this.savingRx.set(false);
        this.showRxForm.set(false);
        this.rxForm.reset();
        this.toast.success('Prescription added.');
      },
      error: () => this.savingRx.set(false),
    });
  }

  addLabReport(medicalRecordId: string, patientId: string): void {
    if (this.labForm.invalid) return;
    this.savingLab.set(true);
    const { testName, notes } = this.labForm.getRawValue();
    this.emrService
      .createLabReport({ medicalRecordId, patientId, testName, results: { notes } })
      .subscribe({
        next: (res) => {
          this.record.update((r) => (r ? { ...r, labReports: [...r.labReports, res.data] } : r));
          this.savingLab.set(false);
          this.showLabForm.set(false);
          this.labForm.reset();
          this.toast.success('Lab test ordered.');
        },
        error: () => this.savingLab.set(false),
      });
  }
}
