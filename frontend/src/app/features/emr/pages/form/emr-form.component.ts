import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmrService } from '../../services/emr.service';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
    selector: 'app-emr-form',
    imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
    template: `
    <app-page-header title="New medical record" />

    <form [formGroup]="form" (ngSubmit)="submit()" class="card max-w-3xl space-y-5 p-6">
      <div>
        <label class="label" for="chiefComplaint">Chief complaint</label>
        <input class="input" id="chiefComplaint" formControlName="chiefComplaint" />
      </div>

      <div>
        <label class="label" for="diagnosis">Diagnosis</label>
        <input class="input" id="diagnosis" formControlName="diagnosis" [class.input-error]="error('diagnosis')" />
        @if (error('diagnosis'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <label class="label" for="icd10Codes">ICD-10 codes (comma separated)</label>
        <input class="input" id="icd10Codes" formControlName="icd10Codes" placeholder="J06.9, R50.9" />
      </div>

      <fieldset class="rounded-md border border-gray-200 p-4">
        <legend class="px-1 text-sm font-semibold text-gray-700">Vital signs</legend>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label class="label" for="temperature">Temp (°C)</label>
            <input class="input" type="number" step="0.1" id="temperature" formControlName="temperature" />
          </div>
          <div>
            <label class="label" for="heartRate">Heart rate</label>
            <input class="input" type="number" id="heartRate" formControlName="heartRate" />
          </div>
          <div>
            <label class="label" for="bloodPressureSystolic">BP systolic</label>
            <input class="input" type="number" id="bloodPressureSystolic" formControlName="bloodPressureSystolic" />
          </div>
          <div>
            <label class="label" for="bloodPressureDiastolic">BP diastolic</label>
            <input class="input" type="number" id="bloodPressureDiastolic" formControlName="bloodPressureDiastolic" />
          </div>
          <div>
            <label class="label" for="oxygenSaturation">O2 saturation (%)</label>
            <input class="input" type="number" id="oxygenSaturation" formControlName="oxygenSaturation" />
          </div>
          <div>
            <label class="label" for="height">Height (cm)</label>
            <input class="input" type="number" id="height" formControlName="height" />
          </div>
          <div>
            <label class="label" for="weight">Weight (kg)</label>
            <input class="input" type="number" id="weight" formControlName="weight" />
          </div>
          <div>
            <label class="label" for="painLevel">Pain level (0–10)</label>
            <input class="input" type="number" min="0" max="10" id="painLevel" formControlName="painLevel" />
          </div>
        </div>
      </fieldset>

      <div>
        <label class="label" for="examinationNotes">Examination notes</label>
        <textarea class="input" rows="3" id="examinationNotes" formControlName="examinationNotes"></textarea>
      </div>

      <div>
        <label class="label" for="treatmentPlan">Treatment plan</label>
        <textarea class="input" rows="3" id="treatmentPlan" formControlName="treatmentPlan"></textarea>
      </div>

      <div>
        <label class="label" for="doctorNotes">Doctor's private notes</label>
        <textarea class="input" rows="2" id="doctorNotes" formControlName="doctorNotes"></textarea>
      </div>

      <div class="flex justify-end gap-3 border-t border-gray-200 pt-5">
        <a routerLink="/emr" class="btn-secondary">Cancel</a>
        <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving…' : 'Create record' }}
        </button>
      </div>
    </form>
  `
})
export class EmrFormComponent {
  private fb = inject(FormBuilder);
  private emrService = inject(EmrService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  patientId = this.route.snapshot.queryParamMap.get('patientId') ?? '';
  saving = signal(false);

  form = this.fb.nonNullable.group({
    chiefComplaint: [''],
    diagnosis: ['', Validators.required],
    icd10Codes: [''],
    temperature: [null as number | null],
    heartRate: [null as number | null],
    bloodPressureSystolic: [null as number | null],
    bloodPressureDiastolic: [null as number | null],
    oxygenSaturation: [null as number | null],
    height: [null as number | null],
    weight: [null as number | null],
    painLevel: [null as number | null],
    examinationNotes: [''],
    treatmentPlan: [''],
    doctorNotes: [''],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  submit(): void {
    if (this.form.invalid || !this.patientId) {
      this.form.markAllAsTouched();
      if (!this.patientId) this.toast.error('No patient selected. Return to Medical Records and select a patient first.');
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const vitalSigns = {
      temperature: raw.temperature ?? undefined,
      heartRate: raw.heartRate ?? undefined,
      bloodPressureSystolic: raw.bloodPressureSystolic ?? undefined,
      bloodPressureDiastolic: raw.bloodPressureDiastolic ?? undefined,
      oxygenSaturation: raw.oxygenSaturation ?? undefined,
      height: raw.height ?? undefined,
      weight: raw.weight ?? undefined,
      painLevel: raw.painLevel ?? undefined,
    };
    const hasVitals = Object.values(vitalSigns).some((v) => v !== undefined);

    this.emrService
      .create({
        patientId: this.patientId,
        chiefComplaint: raw.chiefComplaint || undefined,
        diagnosis: raw.diagnosis,
        icd10Codes: raw.icd10Codes ? raw.icd10Codes.split(',').map((c) => c.trim()).filter(Boolean) : undefined,
        vitalSigns: hasVitals ? vitalSigns : undefined,
        examinationNotes: raw.examinationNotes || undefined,
        treatmentPlan: raw.treatmentPlan || undefined,
        doctorNotes: raw.doctorNotes || undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Medical record created.');
          this.router.navigate(['/emr', res.data.id]);
        },
        error: () => this.saving.set(false),
      });
  }
}
