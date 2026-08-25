import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OtpType } from '../../../../core/models/auth.model';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';

/**
 * One screen for all four code types. What happens after a valid code depends on the
 * type: EMAIL_VERIFICATION and TWO_FACTOR complete a sign-in and come back with a
 * session, while PASSWORD_RESET only proves control of the address and hands off to
 * the set-a-new-password screen. This used to assume a session every time and send
 * everyone to the dashboard.
 */
@Component({
    selector: 'app-verify-otp',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">{{ heading }}</h1>
    <p class="mb-6 text-sm text-gray-500">
      Enter the 6-digit code we sent to <span class="font-medium text-gray-700">{{ email }}</span>.
    </p>

    @if (!email) {
      <p class="rounded-md bg-danger-50 p-3 text-sm text-danger-700">
        We don't know which account this code is for. Please start again.
      </p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label" for="code">Verification code</label>
          <input
            id="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            class="input text-center text-lg tracking-[0.5em]"
            formControlName="code"
            [class.input-error]="error('code')"
          />
          @if (error('code'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>

        <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Verifying…' : submitLabel }}
        </button>
      </form>

      <div class="mt-4 text-center text-sm text-gray-500">
        Didn't get a code?
        <button type="button" class="font-medium text-navy-500 hover:text-navy-600" [disabled]="resending()" (click)="resend()">
          {{ resending() ? 'Sending…' : 'Resend code' }}
        </button>
      </div>
    }

    <p class="mt-6 text-center text-sm text-gray-500">
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Back to sign in</a>
    </p>
  `
})
export class VerifyOtpComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  type = (this.route.snapshot.queryParamMap.get('type') as OtpType) ?? 'EMAIL_VERIFICATION';

  private readonly isPasswordReset = this.type === 'PASSWORD_RESET';

  readonly heading = this.isPasswordReset ? 'Confirm your reset code' : 'Verify your account';
  readonly submitLabel = this.isPasswordReset ? 'Continue' : 'Verify account';

  loading = signal(false);
  resending = signal(false);

  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  submit(): void {
    if (this.form.invalid || !this.email) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.form.getRawValue().code;

    this.loading.set(true);
    this.authService.verifyOtp({ email: this.email, code, type: this.type }).subscribe({
      next: (res) => {
        this.loading.set(false);

        // The reset endpoint takes the same email/code pair and only accepts a code
        // that has already been verified here, so both have to travel forward.
        if (this.isPasswordReset) {
          this.router.navigate(['/auth/reset-password'], {
            queryParams: { email: this.email, token: code },
          });
          return;
        }

        if ('accessToken' in res.data) {
          this.toast.success('Account verified — welcome to VoiceMed Pro!');
          this.router.navigateByUrl('/dashboard');
          return;
        }

        // Verified, but this type doesn't issue a session (phone verification).
        this.toast.success(res.message ?? 'Verified successfully.');
        this.router.navigate(['/auth/login']);
      },
      error: () => this.loading.set(false),
    });
  }

  resend(): void {
    if (!this.email) return;
    this.resending.set(true);
    this.authService.resendOtp({ email: this.email, type: this.type, channel: 'EMAIL' }).subscribe({
      next: () => {
        this.resending.set(false);
        this.toast.success('A new code is on its way.');
      },
      error: () => this.resending.set(false),
    });
  }
}
