import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NavService } from '../../core/services/nav.service';

@Component({
    selector: 'app-shell',
    imports: [RouterOutlet, SidebarComponent, TopbarComponent],
    template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      @if (navService.mobileSidebarOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-overlay cursor-default bg-gray-900/40 lg:hidden"
          aria-label="Close navigation menu"
          (click)="navService.closeMobileSidebar()"
        ></button>
      }
      <app-sidebar />
      <div class="flex flex-1 flex-col overflow-hidden">
        <app-topbar />
        <main class="flex-1 overflow-y-auto p-4 sm:p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class ShellComponent {
  navService = inject(NavService);
}
