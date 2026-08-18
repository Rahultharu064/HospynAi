import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NavService } from '../../core/services/nav.service';

@Component({
    selector: 'app-topbar',
    imports: [RouterLink],
    template: `
    <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        class="btn-ghost !px-2 lg:hidden"
        (click)="navService.toggleMobileSidebar()"
        aria-label="Toggle navigation menu"
        [attr.aria-expanded]="navService.mobileSidebarOpen()"
      >
        <span class="text-lg" aria-hidden="true">☰</span>
      </button>
      <div class="hidden lg:block"></div>

      <div class="relative flex items-center gap-3">
        <button
          type="button"
          class="btn-ghost !px-2"
          (click)="menuOpen.set(!menuOpen())"
          aria-haspopup="true"
        >
          <span class="text-lg">👤</span>
        </button>

        @if (menuOpen()) {
          <div class="absolute right-0 top-12 z-dropdown w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <a
              routerLink="/settings/profile"
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              (click)="menuOpen.set(false)"
            >
              My profile
            </a>
            <button
              type="button"
              class="block w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-gray-50"
              (click)="logout()"
            >
              Sign out
            </button>
          </div>
        }
      </div>
    </header>
  `
})
export class TopbarComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  navService = inject(NavService);
  router = inject(Router);

  menuOpen = signal(false);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
