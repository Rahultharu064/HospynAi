import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';

/**
 * The API emails a 6-digit code, not a magic link, and that code has to be confirmed
 * on the verify screen before a new password is accepted. So this hands off to
 * /auth/verify-otp rather than telling people to look for a link that never arrives.
 *
 * The success panel shows the API's own message verbatim: for a Google-backed account
 * it explains that the password lives with Google, and for everything else it's the
 * deliberately vague "if the email exists…" wording that keeps this from being an
 * account-enumeration oracle.
 */
@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    @if (!submitted()) {
      <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Forgot your password?</h1>
      <p class="mb-6 text-sm text-gray-500">
        Enter your email and we'll send you a 6-digit code to reset your password.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label" for="email">Email address</label>
          <input id="email" type="email" class="input" formControlName="email" [class.input-error]="error('email')" />
          @if (error('email'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>

        <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Sending…' : 'Send reset code' }}
        </button>
      </form>
    } @else {
      <div class="text-center">
        <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Check your inbox</h1>
        <p class="mb-6 text-sm text-gray-500">{{ message() }}</p>

        <a
          class="btn-primary inline-flex w-full items-center justify-center"
          routerLink="/auth/verify-otp"
          [queryParams]="{ email: submittedEmail(), type: 'PASSWORD_RESET' }"
        >
          Enter my code
        </a>
      </div>
    }

    <p class="mt-6 text-center text-sm text-gray-500">
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Back to sign in</a>
    </p>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = signal(false);
  submitted = signal(false);
  submittedEmail = signal('');
  message = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();

    this.loading.set(true);
    this.authService.forgotPassword({ email }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.submittedEmail.set(email);
        this.message.set(
          res.message ?? 'If the email exists in our system, a password reset code has been sent.'
        );
        this.submitted.set(true);
      },
      error: () => this.loading.set(false),
    });
  }
}
