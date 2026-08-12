import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-marketing-nav',
  imports: [RouterLink],
  template: `
    <header
      class="fixed inset-x-0 top-0 z-sticky transition-all duration-moderate ease-default"
      [class.bg-navy-950]="scrolled()"
      [class.bg-navy-950]="scrolled() || mobileOpen()"
      [class.border-b]="scrolled() || mobileOpen()"
      [class.border-navy-800]="scrolled() || mobileOpen()"
      [class.backdrop-blur]="scrolled()"
      [class.bg-opacity-80]="scrolled() && !mobileOpen()"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" class="flex items-center gap-2.5" aria-label="VoiceMed Pro home">
          <span class="relative flex h-8 w-8 items-center justify-center rounded-md bg-teal-400 text-sm font-bold text-navy-950">
            V
            <span class="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-teal-300 ring-2 ring-navy-950"></span>
          </span>
          <span class="font-display text-lg font-semibold text-white">VoiceMed Pro</span>
        </a>

        <nav class="hidden items-center gap-8 lg:flex">
          @for (link of navLinks; track link.href) {
            <a
              [href]="link.href"
              class="font-mono text-xs uppercase tracking-widest text-gray-400 transition-colors hover:text-teal-300"
            >
              {{ link.label }}
            </a>
          }
        </nav>

        <div class="hidden items-center gap-3 lg:flex">
          @if (authService.isAuthenticated()) {
            <a routerLink="/dashboard" class="btn-console-primary">Go to dashboard</a>
          } @else {
            <a routerLink="/auth/login" class="font-mono text-xs uppercase tracking-widest text-gray-300 hover:text-white">
              Sign in
            </a>
            <a routerLink="/auth/register" class="btn-console-primary">Start free trial</a>
          }
        </div>

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-md border border-navy-700 text-gray-300 lg:hidden"
          (click)="mobileOpen.set(!mobileOpen())"
          [attr.aria-expanded]="mobileOpen()"
          aria-label="Toggle menu"
        >
          @if (mobileOpen()) {
            <span aria-hidden="true">✕</span>
          } @else {
            <span aria-hidden="true">☰</span>
          }
        </button>
      </div>

      @if (mobileOpen()) {
        <div class="border-t border-navy-800 px-6 pb-6 pt-2 lg:hidden">
          <nav class="flex flex-col gap-4 py-2">
            @for (link of navLinks; track link.href) {
              <a
                [href]="link.href"
                class="font-mono text-xs uppercase tracking-widest text-gray-400"
                (click)="mobileOpen.set(false)"
              >
                {{ link.label }}
              </a>
            }
          </nav>
          <div class="flex flex-col gap-3 border-t border-navy-800 pt-4">
            @if (authService.isAuthenticated()) {
              <a routerLink="/dashboard" class="btn-console-primary text-center">Go to dashboard</a>
            } @else {
              <a routerLink="/auth/login" class="text-center font-mono text-xs uppercase tracking-widest text-gray-300">
                Sign in
              </a>
              <a routerLink="/auth/register" class="btn-console-primary text-center">Start free trial</a>
            }
          </div>
        </div>
      }
    </header>
  `,
})
export class MarketingNavComponent {
  authService = inject(AuthService);

  scrolled = signal(false);
  mobileOpen = signal(false);

  navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Security', href: '#security' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }
}
