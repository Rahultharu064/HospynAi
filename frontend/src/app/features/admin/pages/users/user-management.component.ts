import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { USER_ROLES, UserManagementResponse } from '../../models/admin.model';
import { UserRole, UserStatus } from '../../../../core/models/user.model';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive, PageHeaderComponent, SpinnerComponent, BadgeComponent],
  template: `
    <app-page-header title="Administration" subtitle="Manage staff accounts, organizations, and system health.">
      <button type="button" class="btn-primary" (click)="showForm.set(!showForm())">
        {{ showForm() ? 'Cancel' : '+ Invite staff member' }}
      </button>
    </app-page-header>

    <nav class="mb-6 flex gap-1 border-b border-gray-200">
      <a routerLink="/admin/users" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Staff</a>
      <a routerLink="/admin/organizations" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Organizations</a>
      <a routerLink="/admin/system" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">System health</a>
    </nav>

    @if (showForm()) {
      <form [formGroup]="form" (ngSubmit)="createUser()" class="card mb-6 grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <div>
          <label class="label" for="firstName">First name</label>
          <input class="input" id="firstName" formControlName="firstName" [class.input-error]="error('firstName')" />
        </div>
        <div>
          <label class="label" for="lastName">Last name</label>
          <input class="input" id="lastName" formControlName="lastName" [class.input-error]="error('lastName')" />
        </div>
        <div>
          <label class="label" for="email">Email</label>
          <input class="input" type="email" id="email" formControlName="email" [class.input-error]="error('email')" />
        </div>
        <div>
          <label class="label" for="password">Temporary password</label>
          <input class="input" type="password" id="password" formControlName="password" [class.input-error]="error('password')" />
        </div>
        <div>
          <label class="label" for="role">Role</label>
          <select class="input" id="role" formControlName="role">
            @for (r of roles; track r) {
              <option [value]="r">{{ r.replace('_', ' ') }}</option>
            }
          </select>
        </div>
        <div class="flex items-end">
          <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || creating()">
            {{ creating() ? 'Creating…' : 'Create account' }}
          </button>
        </div>
      </form>
    }

    <div class="card">
      <div class="border-b border-gray-200 p-4">
        <input type="search" placeholder="Search staff…" class="input sm:max-w-sm" (input)="onSearch($event)" />
      </div>

      @if (loading()) {
        <app-spinner />
      } @else {
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Last login</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              @for (u of users(); track u.id) {
                <tr class="hover:bg-gray-50">
                  <td class="whitespace-nowrap px-4 py-3">
                    <p class="font-medium text-gray-900">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="text-xs text-gray-400">{{ u.email }}</p>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{{ u.role.replace('_', ' ') }}</td>
                  <td class="whitespace-nowrap px-4 py-3"><app-badge [status]="u.status" /></td>
                  <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {{ u.lastLoginAt ? (u.lastLoginAt | date: 'medium') : 'Never' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
                    @if (u.status === 'ACTIVE') {
                      <button type="button" class="text-danger-600 hover:underline" (click)="toggleStatus(u, 'SUSPENDED')">Suspend</button>
                    } @else {
                      <button type="button" class="text-success-600 hover:underline" (click)="toggleStatus(u, 'ACTIVE')">Activate</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class UserManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  roles = USER_ROLES;
  users = signal<UserManagementResponse[]>([]);
  loading = signal(true);
  showForm = signal(false);
  creating = signal(false);

  private search = '';

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['RECEPTIONIST'],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  ngOnInit(): void {
    this.fetch();
  }

  onSearch(event: Event): void {
    this.search = (event.target as HTMLInputElement).value;
    this.fetch();
  }

  createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.creating.set(true);
    const raw = this.form.getRawValue();
    this.adminService.createUser({ ...raw, role: raw.role as UserRole, sendWelcomeEmail: true }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showForm.set(false);
        this.form.reset({ role: 'RECEPTIONIST' });
        this.toast.success('Staff account created.');
        this.fetch();
      },
      error: () => this.creating.set(false),
    });
  }

  toggleStatus(user: UserManagementResponse, status: UserStatus): void {
    this.adminService.updateUser(user.id, { status }).subscribe({
      next: () => {
        this.toast.success(`${user.firstName} is now ${status.toLowerCase()}.`);
        this.fetch();
      },
    });
  }

  private fetch(): void {
    this.loading.set(true);
    this.adminService.listUsers({ search: this.search || undefined, limit: 50 }).subscribe({
      next: (res) => {
        this.users.set(res.users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
