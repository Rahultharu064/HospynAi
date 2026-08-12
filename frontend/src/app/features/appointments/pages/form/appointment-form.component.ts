import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { APPOINTMENT_TYPES, AppointmentType, TimeSlot } from '../../models/appointment.model';
import { DoctorLookupService } from '../../../../core/services/doctor-lookup.service';
import { DoctorSummary } from '../../../../core/models/doctor.model';
import { PatientService } from '../../../patients/services/patient.service';
import { PatientResponse } from '../../../patients/models/patient.model';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, SpinnerComponent],
  template: `
    <app-page-header title="Book appointment" subtitle="Find an available slot and confirm the visit details." />

    <form [formGroup]="form" (ngSubmit)="submit()" class="card max-w-2xl space-y-5 p-6">
      <div>
        <label class="label" for="patientSearch">Patient</label>
        <input id="patientSearch" type="text" class="input" placeholder="Search patient by name…" (input)="onPatientSearch($event)" />
        @if (patientResults().length > 0) {
          <ul class="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
            @for (p of patientResults(); track p.id) {
              <li>
                <button
                  type="button"
                  class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  (click)="selectPatient(p)"
                >
                  {{ p.firstName }} {{ p.lastName }} <span class="text-gray-400">· {{ p.patientId }}</span>
                </button>
              </li>
            }
          </ul>
        }
        @if (selectedPatient(); as p) {
          <p class="mt-2 rounded-md bg-navy-50 px-3 py-2 text-sm text-navy-700">
            Selected: {{ p.firstName }} {{ p.lastName }} ({{ p.patientId }})
          </p>
        }
        @if (error('patientId'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <label class="label" for="doctorId">Doctor</label>
        <select class="input" id="doctorId" formControlName="doctorId" (change)="onDoctorOrDateChange()" [class.input-error]="error('doctorId')">
          <option value="">Select a doctor…</option>
          @for (d of doctors(); track d.id) {
            <option [value]="d.id">Dr. {{ d.fullName }} @if (d.specialization) { — {{ d.specialization }} }</option>
          }
        </select>
        @if (error('doctorId'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label" for="type">Type</label>
          <select class="input" id="type" formControlName="type">
            @for (t of types; track t) {
              <option [value]="t">{{ t.replace('_', ' ') }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label" for="appointmentDate">Date</label>
          <input type="date" class="input" id="appointmentDate" formControlName="appointmentDate" [min]="today" (change)="onDoctorOrDateChange()" [class.input-error]="error('appointmentDate')" />
          @if (error('appointmentDate'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>
      </div>

      <div>
        <div class="label" id="startTimeLabel">Available times</div>
        @if (loadingSlots()) {
          <app-spinner [inline]="true" [size]="20" />
        } @else if (slots().length === 0) {
          <p class="text-sm text-gray-400">Select a doctor and date to see available times.</p>
        } @else {
          <div class="flex flex-wrap gap-2" role="group" aria-labelledby="startTimeLabel">
            @for (slot of slots(); track slot.startTime) {
              <button
                type="button"
                class="rounded-md border px-3 py-1.5 text-sm transition-colors"
                [class.border-navy-500]="form.value.startTime === slot.startTime"
                [class.bg-navy-500]="form.value.startTime === slot.startTime"
                [class.text-white]="form.value.startTime === slot.startTime"
                [class.opacity-40]="!slot.isAvailable"
                [class.cursor-not-allowed]="!slot.isAvailable"
                [disabled]="!slot.isAvailable"
                (click)="pickSlot(slot)"
              >
                {{ slot.startTime }}
              </button>
            }
          </div>
        }
        @if (error('startTime'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <label class="label" for="reason">Reason for visit</label>
        <textarea class="input" rows="2" id="reason" formControlName="reason"></textarea>
      </div>

      <div class="flex justify-end gap-3 border-t border-gray-200 pt-5">
        <a routerLink="/appointments" class="btn-secondary">Cancel</a>
        <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Booking…' : 'Confirm booking' }}
        </button>
      </div>
    </form>
  `,
})
export class AppointmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appointmentService = inject(AppointmentService);
  private doctorLookup = inject(DoctorLookupService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  types = APPOINTMENT_TYPES;
  today = new Date().toISOString().slice(0, 10);

  doctors = signal<DoctorSummary[]>([]);
  patientResults = signal<PatientResponse[]>([]);
  selectedPatient = signal<PatientResponse | null>(null);
  slots = signal<TimeSlot[]>([]);
  loadingSlots = signal(false);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    patientId: ['', [Validators.required]],
    doctorId: ['', [Validators.required]],
    type: ['IN_PERSON'],
    appointmentDate: ['', [Validators.required]],
    startTime: ['', [Validators.required]],
    reason: [''],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  ngOnInit(): void {
    this.doctorLookup.list().subscribe({ next: (res) => this.doctors.set(res.data) });

    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.patientService.getById(patientId).subscribe({
        next: (res) => this.selectPatient(res.data),
      });
    }
  }

  onPatientSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (term.length < 2) {
      this.patientResults.set([]);
      return;
    }
    this.patientService.list({ search: term, limit: 8 }).subscribe({
      next: (res) => this.patientResults.set(res.data),
    });
  }

  selectPatient(p: PatientResponse): void {
    this.selectedPatient.set(p);
    this.form.patchValue({ patientId: p.id });
    this.patientResults.set([]);
  }

  onDoctorOrDateChange(): void {
    const { doctorId, appointmentDate } = this.form.getRawValue();
    if (!doctorId || !appointmentDate) return;

    this.loadingSlots.set(true);
    this.form.patchValue({ startTime: '' });
    this.appointmentService.getAvailability(doctorId, appointmentDate).subscribe({
      next: (res) => {
        this.slots.set(res.data.slots);
        this.loadingSlots.set(false);
      },
      error: () => this.loadingSlots.set(false),
    });
  }

  pickSlot(slot: TimeSlot): void {
    if (!slot.isAvailable) return;
    this.form.patchValue({ startTime: slot.startTime });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    this.appointmentService
      .create({
        patientId: raw.patientId,
        doctorId: raw.doctorId,
        appointmentDate: raw.appointmentDate,
        startTime: raw.startTime,
        type: raw.type as AppointmentType,
        reason: raw.reason || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Appointment booked.');
          this.router.navigate(['/appointments']);
        },
        error: () => this.saving.set(false),
      });
  }
}
