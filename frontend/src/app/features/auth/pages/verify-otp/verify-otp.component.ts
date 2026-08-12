import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { OtpType } from '../../../../core/models/auth.model';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Verify your account</h1>
    <p class="mb-6 text-sm text-gray-500">
      Enter the 6-digit code we sent to <span class="font-medium text-gray-700">{{ email }}</span>.
    </p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      <div>
        <label class="label" for="code">Verification code</label>
        <input
          id="code"
          type="text"
          inputmode="numeric"
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
        {{ loading() ? 'Verifying…' : 'Verify account' }}
      </button>
    </form>

    <div class="mt-4 text-center text-sm text-gray-500">
      Didn't get a code?
      <button type="button" class="font-medium text-navy-500 hover:text-navy-600" [disabled]="resending()" (click)="resend()">
        {{ resending() ? 'Sending…' : 'Resend code' }}
      </button>
    </div>

    <p class="mt-6 text-center text-sm text-gray-500">
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Back to sign in</a>
    </p>
  `,
})
export class VerifyOtpComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  type = (this.route.snapshot.queryParamMap.get('type') as OtpType) ?? 'EMAIL_VERIFICATION';

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

    this.loading.set(true);
    this.authService
      .verifyOtp({ email: this.email, code: this.form.getRawValue().code, type: this.type })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('Account verified — welcome to VoiceMed Pro!');
          this.router.navigate(['/dashboard']);
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
