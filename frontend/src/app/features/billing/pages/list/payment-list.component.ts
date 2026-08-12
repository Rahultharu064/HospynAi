import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { PaymentResponse, PaymentStatus } from '../../models/billing.model';
import { Pagination } from '../../../../core/models/api-response.model';
import { AuthService } from '../../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-payment-list',
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
    <app-page-header title="Billing" subtitle="Invoices, payments, and revenue.">
      @if (canCreate()) {
        <a routerLink="/billing/new" class="btn-primary">+ New invoice</a>
      }
    </app-page-header>

    <div class="card">
      <div class="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <input type="search" placeholder="Search by invoice ID or patient…" class="input sm:max-w-sm" (input)="onSearch($event)" />
        <select class="input sm:max-w-xs" (change)="onStatusChange($event)">
          <option value="">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s.replace('_', ' ') }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <app-spinner />
      } @else if (payments().length === 0) {
        <app-empty-state icon="🧾" title="No invoices found" />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Patient</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Due date</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              @for (p of payments(); track p.id) {
                <tr class="cursor-pointer hover:bg-gray-50" [routerLink]="['/billing', p.id]">
                  <td class="whitespace-nowrap px-4 py-3 font-medium text-navy-600">{{ p.invoiceId }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ p.patient.firstName }} {{ p.patient.lastName }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{{ p.totalAmount | currency: p.currency }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{{ p.dueDate | date: 'mediumDate' }}</td>
                  <td class="whitespace-nowrap px-4 py-3"><app-badge [status]="p.status" /></td>
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
export class PaymentListComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  statuses: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'];

  payments = signal<PaymentResponse[]>([]);
  pagination = signal<Pagination | null>(null);
  loading = signal(true);

  private page = 1;
  private search = '';
  private status = '';

  canCreate = () => ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'].includes(this.authService.role() ?? '');

  ngOnInit(): void {
    this.fetch();
  }

  onSearch(event: Event): void {
    this.search = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.fetch();
  }

  onStatusChange(event: Event): void {
    this.status = (event.target as HTMLSelectElement).value;
    this.page = 1;
    this.fetch();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.billingService
      .list({
        page: this.page,
        limit: 20,
        search: this.search || undefined,
        status: (this.status as PaymentStatus) || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (res) => {
          this.payments.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
