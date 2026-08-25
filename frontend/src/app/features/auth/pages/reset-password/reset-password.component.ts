import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { passwordMatchValidator, passwordStrengthValidator } from '../../../../shared/utils/validators.util';

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Set a new password</h1>
    <p class="mb-6 text-sm text-gray-500">Choose a strong password you haven't used before.</p>

    @if (!token || !email) {
      <p class="rounded-md bg-danger-50 p-3 text-sm text-danger-700">
        This reset link is invalid or has expired. Please request a new one.
      </p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label" for="newPassword">New password</label>
          <input id="newPassword" type="password" class="input" formControlName="newPassword" [class.input-error]="error('newPassword')" />
          @if (error('newPassword'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>

        <div>
          <label class="label" for="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" type="password" class="input" formControlName="confirmPassword" [class.input-error]="error('confirmPassword')" />
          @if (error('confirmPassword'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>

        <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Resetting…' : 'Reset password' }}
        </button>
      </form>
    }

    <p class="mt-6 text-center text-sm text-gray-500">
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Back to sign in</a>
    </p>
  `
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // Both arrive from the verify-code step. The API scopes a reset code to the account
  // it was issued to, so the email is as load-bearing as the code itself.
  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  loading = signal(false);

  form = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  submit(): void {
    if (this.form.invalid || !this.token || !this.email) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService
      .resetPassword({ email: this.email, token: this.token, ...this.form.getRawValue() })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Password reset — please sign in with your new password.');
          this.router.navigate(['/auth/login']);
        },
        error: () => this.loading.set(false),
      });
  }
}
