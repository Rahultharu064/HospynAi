import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavService } from '../../core/services/nav.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, RouterLinkActive],
    template: `
    <aside
      class="fixed inset-y-0 left-0 z-drawer flex h-full w-64 -translate-x-full flex-col border-r border-gray-200 bg-white transition-transform duration-moderate ease-default lg:static lg:translate-x-0"
      [class.translate-x-0]="navService.mobileSidebarOpen()"
    >
      <div class="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-navy-500 text-sm font-bold text-white">
          {{ appName()[0] }}
        </div>
        <span class="font-display text-lg font-semibold text-gray-900">{{ appName() }}</span>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        @for (item of items(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-navy-50 text-navy-700"
            [routerLinkActiveOptions]="{ exact: false }"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-fast hover:bg-gray-100"
            (click)="navService.closeMobileSidebar()"
          >
            <span class="text-base leading-none">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
            {{ initials() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-900">{{ fullName() }}</p>
            <p class="truncate text-xs text-gray-500">{{ roleLabel() }}</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);
  navService = inject(NavService);

  items = computed(() => this.navService.itemsForRole(this.authService.role()));

  appName = () => environment.appName;

  fullName = computed(() => {
    const u = this.authService.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  initials = computed(() => {
    const u = this.authService.currentUser();
    return u ? `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase() : '';
  });

  roleLabel = computed(() => {
    const role = this.authService.role();
    return role ? role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  });
}
