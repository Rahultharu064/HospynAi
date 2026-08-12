import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { PAYMENT_METHODS, PaymentMethod, PaymentResponse } from '../../models/billing.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-payment-detail',
    imports: [CommonModule, FormsModule, PageHeaderComponent, SpinnerComponent, BadgeComponent],
    template: `
    @if (loading()) {
      <app-spinner />
    } @else {
    @if (payment(); as p) {
      <app-page-header [title]="p.invoiceId" [subtitle]="p.patient.firstName + ' ' + p.patient.lastName">
        <app-badge [status]="p.status" />
        @if (canProcess() && p.status === 'PENDING') {
          <select class="input !w-auto" [(ngModel)]="selectedMethod" [ngModelOptions]="{ standalone: true }">
            @for (m of methods; track m) {
              <option [value]="m">{{ m.replace('_', ' ') }}</option>
            }
          </select>
          <button type="button" class="btn-primary" (click)="markPaid(p.id)" [disabled]="processing()">
            {{ processing() ? 'Processing…' : 'Mark as paid' }}
          </button>
        }
        @if (canRefund() && p.status === 'COMPLETED') {
          <button type="button" class="btn-danger" (click)="refund(p.id, p.totalAmount)">Refund</button>
        }
      </app-page-header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="card p-6 lg:col-span-2">
          <table class="w-full text-sm">
            <tbody>
              <tr class="border-b border-gray-100">
                <td class="py-2 text-gray-500">Subtotal</td>
                <td class="py-2 text-right font-medium">{{ p.amount | currency: p.currency }}</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-2 text-gray-500">Tax</td>
                <td class="py-2 text-right font-medium">{{ p.tax | currency: p.currency }}</td>
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-2 text-gray-500">Discount</td>
                <td class="py-2 text-right font-medium">-{{ p.discount | currency: p.currency }}</td>
              </tr>
              <tr>
                <td class="py-2 text-base font-semibold text-gray-900">Total</td>
                <td class="py-2 text-right text-base font-semibold text-gray-900">{{ p.totalAmount | currency: p.currency }}</td>
              </tr>
            </tbody>
          </table>

          @if (p.description) {
            <p class="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">{{ p.description }}</p>
          }
        </div>

        <div class="card space-y-3 p-6 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Method</span>
            <span class="font-medium">{{ (p.method || 'Not set').replace('_', ' ') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Due date</span>
            <span class="font-medium">{{ p.dueDate | date: 'mediumDate' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Paid at</span>
            <span class="font-medium">{{ p.paidAt ? (p.paidAt | date: 'medium') : '—' }}</span>
          </div>
          @if (p.refundAmount) {
            <div class="flex justify-between text-danger-600">
              <span>Refunded</span>
              <span class="font-medium">{{ p.refundAmount | currency: p.currency }}</span>
            </div>
          }
          <div class="flex justify-between">
            <span class="text-gray-500">Created by</span>
            <span class="font-medium">{{ p.createdBy.firstName }} {{ p.createdBy.lastName }}</span>
          </div>
        </div>
      </div>
    }
    }
  `
})
export class PaymentDetailComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  methods = PAYMENT_METHODS;
  payment = signal<PaymentResponse | null>(null);
  loading = signal(true);
  processing = signal(false);
  selectedMethod: PaymentMethod = 'CASH';

  canProcess = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(this.authService.role() ?? '');
  canRefund = () => ['SUPER_ADMIN', 'ADMIN'].includes(this.authService.role() ?? '');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.billingService.getById(id).subscribe({
      next: (res) => {
        this.payment.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markPaid(paymentId: string): void {
    this.processing.set(true);
    this.billingService.process({ paymentId, method: this.selectedMethod }).subscribe({
      next: (res) => {
        this.payment.set(res.data);
        this.processing.set(false);
        this.toast.success('Payment recorded.');
      },
      error: () => this.processing.set(false),
    });
  }

  refund(id: string, amount: number): void {
    if (!confirm(`Refund the full amount of this invoice?`)) return;
    this.billingService.refund(id, amount).subscribe({
      next: (res) => {
        this.payment.set(res.data);
        this.toast.success('Refund processed.');
      },
    });
  }
}
