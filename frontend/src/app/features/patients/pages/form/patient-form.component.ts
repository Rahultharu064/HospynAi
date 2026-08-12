import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient.service';
import { BLOOD_GROUP_OPTIONS, BloodGroup, GENDER_OPTIONS, Gender } from '../../models/patient.model';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, SpinnerComponent],
  template: `
    <app-page-header [title]="isEdit() ? 'Edit patient' : 'Register patient'" />

    @if (loadingPatient()) {
      <app-spinner />
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="card space-y-8 p-6">
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <h2 class="col-span-full text-sm font-semibold uppercase tracking-wide text-gray-500">
            Personal information
          </h2>

          <div>
            <label class="label" for="firstName">First name</label>
            <input class="input" id="firstName" formControlName="firstName" [class.input-error]="error('firstName')" />
            @if (error('firstName'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="lastName">Last name</label>
            <input class="input" id="lastName" formControlName="lastName" [class.input-error]="error('lastName')" />
            @if (error('lastName'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="email">Email</label>
            <input class="input" type="email" id="email" formControlName="email" [class.input-error]="error('email')" />
            @if (error('email'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="phone">Phone</label>
            <input class="input" id="phone" formControlName="phone" />
          </div>

          <div>
            <label class="label" for="dateOfBirth">Date of birth</label>
            <input class="input" type="date" id="dateOfBirth" formControlName="dateOfBirth" />
          </div>

          <div>
            <label class="label" for="gender">Gender</label>
            <select class="input" id="gender" formControlName="gender">
              <option value="">Select…</option>
              @for (g of genders; track g) {
                <option [value]="g">{{ g | titlecase }}</option>
              }
            </select>
          </div>

          <div>
            <label class="label" for="bloodGroup">Blood group</label>
            <select class="input" id="bloodGroup" formControlName="bloodGroup">
              <option value="">Select…</option>
              @for (b of bloodGroups; track b) {
                <option [value]="b">{{ b.replace('_', ' ') }}</option>
              }
            </select>
          </div>
        </section>

        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <h2 class="col-span-full text-sm font-semibold uppercase tracking-wide text-gray-500">Address</h2>

          <div class="sm:col-span-2">
            <label class="label" for="address">Street address</label>
            <input class="input" id="address" formControlName="address" />
          </div>
          <div>
            <label class="label" for="city">City</label>
            <input class="input" id="city" formControlName="city" />
          </div>
          <div>
            <label class="label" for="state">State</label>
            <input class="input" id="state" formControlName="state" />
          </div>
          <div>
            <label class="label" for="country">Country</label>
            <input class="input" id="country" formControlName="country" />
          </div>
          <div>
            <label class="label" for="zipCode">ZIP code</label>
            <input class="input" id="zipCode" formControlName="zipCode" />
          </div>
        </section>

        <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <h2 class="col-span-full text-sm font-semibold uppercase tracking-wide text-gray-500">
            Emergency contact
          </h2>
          <div>
            <label class="label" for="emergencyContactName">Name</label>
            <input class="input" id="emergencyContactName" formControlName="emergencyContactName" />
          </div>
          <div>
            <label class="label" for="emergencyContactPhone">Phone</label>
            <input class="input" id="emergencyContactPhone" formControlName="emergencyContactPhone" />
          </div>
          <div>
            <label class="label" for="emergencyContactRelation">Relation</label>
            <input class="input" id="emergencyContactRelation" formControlName="emergencyContactRelation" />
          </div>
        </section>

        <section class="grid grid-cols-1 gap-4">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">Medical information</h2>
          <div>
            <label class="label" for="allergies">Allergies (comma separated)</label>
            <input class="input" id="allergies" formControlName="allergies" placeholder="Penicillin, Peanuts" />
          </div>
          <div>
            <label class="label" for="chronicConditions">Chronic conditions (comma separated)</label>
            <input class="input" id="chronicConditions" formControlName="chronicConditions" placeholder="Diabetes, Hypertension" />
          </div>
          <div>
            <label class="label" for="currentMedications">Current medications (comma separated)</label>
            <input class="input" id="currentMedications" formControlName="currentMedications" />
          </div>
          <div>
            <label class="label" for="notes">Notes</label>
            <textarea class="input" rows="3" id="notes" formControlName="notes"></textarea>
          </div>
        </section>

        <div class="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <a routerLink="/patients" class="btn-secondary">Cancel</a>
          <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : isEdit() ? 'Save changes' : 'Register patient' }}
          </button>
        </div>
      </form>
    }
  `,
})
export class PatientFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  genders = GENDER_OPTIONS;
  bloodGroups = BLOOD_GROUP_OPTIONS;

  patientId = this.route.snapshot.paramMap.get('id');
  isEdit = signal(!!this.patientId);
  loadingPatient = signal(!!this.patientId);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],
    phone: [''],
    dateOfBirth: [''],
    gender: [''],
    bloodGroup: [''],
    address: [''],
    city: [''],
    state: [''],
    country: [''],
    zipCode: [''],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    emergencyContactRelation: [''],
    allergies: [''],
    chronicConditions: [''],
    currentMedications: [''],
    notes: [''],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  ngOnInit(): void {
    if (this.patientId) {
      this.patientService.getById(this.patientId).subscribe({
        next: (res) => {
          const p = res.data;
          this.form.patchValue({
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email ?? '',
            phone: p.phone ?? '',
            dateOfBirth: p.dateOfBirth?.slice(0, 10) ?? '',
            gender: p.gender ?? '',
            bloodGroup: p.bloodGroup ?? '',
            address: p.address ?? '',
            city: p.city ?? '',
            state: p.state ?? '',
            country: p.country ?? '',
            zipCode: p.zipCode ?? '',
            emergencyContactName: p.emergencyContact?.name ?? '',
            emergencyContactPhone: p.emergencyContact?.phone ?? '',
            emergencyContactRelation: p.emergencyContact?.relation ?? '',
            allergies: p.allergies.join(', '),
            chronicConditions: p.chronicConditions.join(', '),
            currentMedications: p.currentMedications.join(', '),
            notes: p.notes ?? '',
          });
          this.loadingPatient.set(false);
        },
        error: () => this.loadingPatient.set(false),
      });
    }
  }

  private toList(value: string): string[] {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      firstName: raw.firstName,
      lastName: raw.lastName,
      email: raw.email || undefined,
      phone: raw.phone || undefined,
      dateOfBirth: raw.dateOfBirth || undefined,
      gender: (raw.gender || undefined) as Gender | undefined,
      bloodGroup: (raw.bloodGroup || undefined) as BloodGroup | undefined,
      address: raw.address || undefined,
      city: raw.city || undefined,
      state: raw.state || undefined,
      country: raw.country || undefined,
      zipCode: raw.zipCode || undefined,
      emergencyContactName: raw.emergencyContactName || undefined,
      emergencyContactPhone: raw.emergencyContactPhone || undefined,
      emergencyContactRelation: raw.emergencyContactRelation || undefined,
      allergies: this.toList(raw.allergies),
      chronicConditions: this.toList(raw.chronicConditions),
      currentMedications: this.toList(raw.currentMedications),
      notes: raw.notes || undefined,
    };

    const request$ = this.patientId
      ? this.patientService.update(this.patientId, payload)
      : this.patientService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.toast.success(this.isEdit() ? 'Patient updated.' : 'Patient registered.');
        this.router.navigate(['/patients', res.data.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
