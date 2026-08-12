import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { passwordMatchValidator, passwordStrengthValidator } from '../../../../shared/utils/validators.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Create your account</h1>
    <p class="mb-6 text-sm text-gray-500">Get started with VoiceMed Pro in a few seconds.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label" for="firstName">First name</label>
          <input id="firstName" type="text" class="input" formControlName="firstName" [class.input-error]="error('firstName')" />
          @if (error('firstName'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>
        <div>
          <label class="label" for="lastName">Last name</label>
          <input id="lastName" type="text" class="input" formControlName="lastName" [class.input-error]="error('lastName')" />
          @if (error('lastName'); as msg) {
            <p class="field-error">{{ msg }}</p>
          }
        </div>
      </div>

      <div>
        <label class="label" for="email">Email address</label>
        <input id="email" type="email" class="input" formControlName="email" autocomplete="email" [class.input-error]="error('email')" />
        @if (error('email'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <label class="label" for="phone">Phone (optional)</label>
        <input id="phone" type="tel" class="input" formControlName="phone" />
      </div>

      <div>
        <label class="label" for="password">Password</label>
        <input id="password" type="password" class="input" formControlName="password" autocomplete="new-password" [class.input-error]="error('password')" />
        @if (error('password'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <label class="label" for="confirmPassword">Confirm password</label>
        <input id="confirmPassword" type="password" class="input" formControlName="confirmPassword" autocomplete="new-password" [class.input-error]="error('confirmPassword')" />
        @if (error('confirmPassword'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <label class="flex items-start gap-2 text-sm text-gray-600">
        <input type="checkbox" formControlName="acceptTerms" class="mt-0.5 rounded border-gray-300 text-navy-500 focus:ring-navy-500" />
        <span>I agree to the Terms of Service and Privacy Policy</span>
      </label>

      <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Already have an account?
      <a routerLink="/auth/login" class="font-medium text-navy-500 hover:text-navy-600">Sign in</a>
    </p>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);

  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') }
  );

  error(field: string): string | null {
    return firstErrorMessage(this.form.get(field));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { phone, ...rest } = this.form.getRawValue();

    this.authService
      .register({ ...rest, phone: phone || undefined, acceptPrivacy: rest.acceptTerms })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.toast.success('Account created — check your email for a verification code.');
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: { email: res.data.email, type: 'EMAIL_VERIFICATION' },
          });
        },
        error: () => this.loading.set(false),
      });
  }
}
