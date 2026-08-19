import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Lands here after the backend's /auth/google/callback redirect. It carries either
 * ?token=... (success — refresh token already landed as an httpOnly cookie) or
 * ?error=... (Google login failed server-side). There's nothing to render beyond a
 * brief loading state; this page's only job is to finish the session handoff and
 * move on.
 */
@Component({
  selector: 'app-google-callback',
  template: `
    <div class="flex flex-col items-center gap-3 py-8 text-center">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-navy-200 border-t-navy-500"></div>
      <p class="text-sm text-gray-500">Finishing sign-in with Google…</p>
    </div>
  `,
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const error = params.get('error');
    const token = params.get('token');

    if (error) {
      this.toast.error(error);
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!token) {
      this.toast.error('Google sign-in failed. Please try again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.authService.completeGoogleLogin(token).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        this.authService.clearSession();
        this.toast.error('Google sign-in failed. Please try again.');
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
