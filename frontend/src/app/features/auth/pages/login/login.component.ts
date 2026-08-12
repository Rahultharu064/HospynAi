import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { firstErrorMessage } from '../../../../shared/utils/form-errors.util';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    template: `
    <h1 class="mb-1 font-display text-xl font-semibold text-gray-900">Welcome back</h1>
    <p class="mb-6 text-sm text-gray-500">Sign in to your VoiceMed Pro workspace.</p>

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      <div>
        <label class="label" for="email">Email address</label>
        <input id="email" type="email" class="input" formControlName="email" autocomplete="email" [class.input-error]="error('email')" />
        @if (error('email'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <div>
        <div class="flex items-center justify-between">
          <label class="label" for="password">Password</label>
          <a routerLink="/auth/forgot-password" class="text-xs font-medium text-navy-500 hover:text-navy-600">
            Forgot password?
          </a>
        </div>
        <input id="password" type="password" class="input" formControlName="password" autocomplete="current-password" [class.input-error]="error('password')" />
        @if (error('password'); as msg) {
          <p class="field-error">{{ msg }}</p>
        }
      </div>

      <label class="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" formControlName="rememberMe" class="rounded border-gray-300 text-navy-500 focus:ring-navy-500" />
        Remember me for 30 days
      </label>

      <button type="submit" class="btn-primary w-full" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <div class="my-6 flex items-center gap-3">
      <div class="h-px flex-1 bg-gray-200"></div>
      <span class="text-xs text-gray-400">OR</span>
      <div class="h-px flex-1 bg-gray-200"></div>
    </div>

    <a [href]="googleAuthUrl" class="btn-secondary w-full">Continue with Google</a>

    <p class="mt-6 text-center text-sm text-gray-500">
      Don't have an account?
      <a routerLink="/auth/register" class="font-medium text-navy-500 hover:text-navy-600">Create one</a>
    </p>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loading = signal(false);
  googleAuthUrl = `${environment.apiUrl}/auth/google`;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
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
    const { email, password, rememberMe } = this.form.getRawValue();

    this.authService.login({ email, password, rememberMe }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if ('requiresVerification' in res.data) {
          this.toast.info(res.message ?? 'Please verify your account to continue.');
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: { email, type: 'EMAIL_VERIFICATION' },
          });
          return;
        }
        this.toast.success('Welcome back!');
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/dashboard';
        this.router.navigateByUrl(redirectTo);
      },
      error: () => this.loading.set(false),
    });
  }
}
