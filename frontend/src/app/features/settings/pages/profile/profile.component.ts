import { Component, OnInit, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserProfile } from '../../../../core/models/user.model';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { passwordMatchValidator, passwordStrengthValidator } from '../../../../shared/utils/validators.util';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';

@Component({
    selector: 'app-profile',
    imports: [ReactiveFormsModule, PageHeaderComponent, SpinnerComponent],
    template: `
    <app-page-header title="My profile" subtitle="Update your personal details and password." />

    @if (loading()) {
      <app-spinner />
    } @else {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="card space-y-4 p-6">
          <h2 class="font-display text-base font-semibold text-gray-900">Personal details</h2>

          <div>
            <label class="label" for="firstName">First name</label>
            <input id="firstName" class="input" formControlName="firstName" [class.input-error]="profileError('firstName')" />
            @if (profileError('firstName'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="lastName">Last name</label>
            <input id="lastName" class="input" formControlName="lastName" [class.input-error]="profileError('lastName')" />
            @if (profileError('lastName'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="phone">Phone</label>
            <input id="phone" class="input" formControlName="phone" />
          </div>

          <div>
            <label class="label" for="email">Email</label>
            <input id="email" class="input" [value]="profile()?.email" disabled />
          </div>

          <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || savingProfile()">
            {{ savingProfile() ? 'Saving…' : 'Save changes' }}
          </button>
        </form>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="card space-y-4 p-6">
          <h2 class="font-display text-base font-semibold text-gray-900">Change password</h2>

          <div>
            <label class="label" for="currentPassword">Current password</label>
            <input id="currentPassword" type="password" class="input" formControlName="currentPassword" [class.input-error]="passwordError('currentPassword')" />
            @if (passwordError('currentPassword'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="newPassword">New password</label>
            <input id="newPassword" type="password" class="input" formControlName="newPassword" [class.input-error]="passwordError('newPassword')" />
            @if (passwordError('newPassword'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <div>
            <label class="label" for="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" type="password" class="input" formControlName="confirmPassword" [class.input-error]="passwordError('confirmPassword')" />
            @if (passwordError('confirmPassword'); as msg) {
              <p class="field-error">{{ msg }}</p>
            }
          </div>

          <button type="submit" class="btn-primary" [disabled]="passwordForm.invalid || savingPassword()">
            {{ savingPassword() ? 'Updating…' : 'Update password' }}
          </button>
        </form>
      </div>
    }
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  savingProfile = signal(false);
  savingPassword = signal(false);

  profileForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  profileError(field: string): string | null {
    return firstErrorMessage(this.profileForm.get(field));
  }

  passwordError(field: string): string | null {
    return firstErrorMessage(this.passwordForm.get(field));
  }

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.profileForm.patchValue({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          phone: res.data.phone ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    const raw = this.profileForm.getRawValue();
    this.authService.updateProfile({ ...raw, phone: raw.phone || null }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.toast.success('Profile updated.');
      },
      error: () => this.savingProfile.set(false),
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    this.authService.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success('Password updated.');
      },
      error: () => this.savingPassword.set(false),
    });
  }
}
