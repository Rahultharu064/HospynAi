import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { PAYMENT_METHODS, PaymentMethod } from '../../models/billing.model';
import { PatientService } from '../../../patients/services/patient.service';
import { PatientResponse } from '../../../patients/models/patient.model';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent],
  template: `
    <app-page-header title="New invoice" />

    <form [formGroup]="form" (ngSubmit)="submit()" class="card max-w-xl space-y-5 p-6">
      <div>
        <label class="label" for="patientSearch">Patient</label>
        <input id="patientSearch" type="text" class="input" placeholder="Search patient…" (input)="onPatientSearch($event)" />
        @if (patientResults().length > 0) {
          <ul class="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
            @for (p of patientResults(); track p.id) {
              <li>
                <button type="button" class="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" (click)="selectPatient(p)">
                  {{ p.firstName }} {{ p.lastName }} <span class="text-gray-400">· {{ p.patientId }}</span>
                </button>
              </li>
            }
          </ul>
        }
        @if (selectedPatient(); as p) {
          <p class="mt-2 rounded-md bg-navy-50 px-3 py-2 text-sm text-navy-700">Billing to: {{ p.firstName }} {{ p.lastName }}</p>
        }
        @if (error('patientId'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="label" for="amount">Amount</label>
          <input class="input" type="number" step="0.01" id="amount" formControlName="amount" [class.input-error]="error('amount')" />
          @if (error('amount'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>
        <div>
          <label class="label" for="tax">Tax</label>
          <input class="input" type="number" step="0.01" id="tax" formControlName="tax" />
        </div>
        <div>
          <label class="label" for="discount">Discount</label>
          <input class="input" type="number" step="0.01" id="discount" formControlName="discount" />
        </div>
      </div>

      <div>
        <label class="label" for="method">Payment method</label>
        <select class="input" id="method" formControlName="method">
          <option value="">Not yet paid</option>
          @for (m of methods; track m) {
            <option [value]="m">{{ m.replace('_', ' ') }}</option>
          }
        </select>
      </div>

      <div>
        <label class="label" for="dueDate">Due date</label>
        <input class="input" type="date" id="dueDate" formControlName="dueDate" />
      </div>

      <div>
        <label class="label" for="description">Description</label>
        <textarea class="input" rows="2" id="description" formControlName="description"></textarea>
      </div>

      <div class="flex justify-end gap-3 border-t border-gray-200 pt-5">
        <a routerLink="/billing" class="btn-secondary">Cancel</a>
        <button type="submit" class="btn-primary" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Creating…' : 'Create invoice' }}
        </button>
      </div>
    </form>
  `,
})
export class PaymentFormComponent {
  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private toast = inject(ToastService);

  methods = PAYMENT_METHODS;
  patientResults = signal<PatientResponse[]>([]);
  selectedPatient = signal<PatientResponse | null>(null);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    patientId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    tax: [0],
    discount: [0],
    method: [''],
    dueDate: [''],
    description: [''],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  onPatientSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    if (term.length < 2) {
      this.patientResults.set([]);
      return;
    }
    this.patientService.list({ search: term, limit: 8 }).subscribe({ next: (res) => this.patientResults.set(res.data) });
  }

  selectPatient(p: PatientResponse): void {
    this.selectedPatient.set(p);
    this.form.patchValue({ patientId: p.id });
    this.patientResults.set([]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    this.billingService
      .create({
        patientId: raw.patientId,
        amount: raw.amount,
        tax: raw.tax || undefined,
        discount: raw.discount || undefined,
        method: (raw.method || undefined) as PaymentMethod | undefined,
        dueDate: raw.dueDate || undefined,
        description: raw.description || undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success('Invoice created.');
          this.router.navigate(['/billing', res.data.id]);
        },
        error: () => this.saving.set(false),
      });
  }
}
