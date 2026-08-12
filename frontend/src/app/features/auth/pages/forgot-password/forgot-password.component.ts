import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    @if (!submitted()) {
      <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Forgot your password?</h1>
      <p class="mb-6 text-sm text-gray-500">
        Enter your email and we'll send you a link to reset your password.
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
          {{ loading() ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>
    } @else {
      <div class="text-center">
        <div class="mb-3 text-4xl">📧</div>
        <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Check your inbox</h1>
        <p class="text-sm text-gray-500">
          If an account exists for that email, a password reset link is on its way.
        </p>
      </div>
    }

    <p class="mt-6 text-center text-sm text-gray-500">
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Back to sign in</a>
    </p>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = signal(false);
  submitted = signal(false);

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

    this.loading.set(true);
    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => this.loading.set(false),
    });
  }
}
