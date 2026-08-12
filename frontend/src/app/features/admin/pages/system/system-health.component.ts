import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { PlatformStats, SystemHealthResponse } from '../../models/admin.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
    selector: 'app-system-health',
    imports: [CommonModule, RouterLink, RouterLinkActive, PageHeaderComponent, SpinnerComponent, BadgeComponent],
    template: `
    <app-page-header title="Administration" subtitle="Manage staff accounts, organizations, and system health." />

    <nav class="mb-6 flex gap-1 border-b border-gray-200">
      <a routerLink="/admin/users" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Staff</a>
      <a routerLink="/admin/organizations" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Organizations</a>
      <a routerLink="/admin/system" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">System health</a>
    </nav>

    @if (loading()) {
      <app-spinner />
    } @else {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        @if (health(); as h) {
          <div class="card p-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-display text-base font-semibold text-gray-900">System status</h2>
              <app-badge [status]="h.status" [tone]="h.status === 'healthy' ? 'success' : 'danger'" />
            </div>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-gray-500">Uptime</dt><dd>{{ formatUptime(h.uptime) }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500">Version</dt><dd>{{ h.version }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500">Database</dt><dd>{{ h.database.status }} ({{ h.database.connections }} conns)</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500">Redis</dt><dd>{{ h.redis.status }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500">Storage</dt><dd>{{ h.storage.used }} / {{ h.storage.total }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500">Queue</dt><dd>{{ h.queue.pending }} pending, {{ h.queue.failed }} failed</dd></div>
            </dl>
          </div>
        }

        @if (stats(); as s) {
          <div class="card p-6">
            <h2 class="mb-4 font-display text-base font-semibold text-gray-900">Platform stats</h2>
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div><dt class="text-gray-400">Organizations</dt><dd class="text-lg font-semibold text-gray-900">{{ s.organizations.total }}</dd></div>
              <div><dt class="text-gray-400">Total users</dt><dd class="text-lg font-semibold text-gray-900">{{ s.users.total }}</dd></div>
              <div><dt class="text-gray-400">Revenue (total)</dt><dd class="text-lg font-semibold text-gray-900">{{ s.revenue.total | currency }}</dd></div>
              <div><dt class="text-gray-400">Revenue (month)</dt><dd class="text-lg font-semibold text-gray-900">{{ s.revenue.thisMonth | currency }}</dd></div>
              <div><dt class="text-gray-400">Appointments</dt><dd class="text-lg font-semibold text-gray-900">{{ s.usage.totalAppointments }}</dd></div>
              <div><dt class="text-gray-400">EMRs</dt><dd class="text-lg font-semibold text-gray-900">{{ s.usage.totalEMRs }}</dd></div>
            </dl>
          </div>
        }
      </div>
    }
  `
})
export class SystemHealthComponent implements OnInit {
  private adminService = inject(AdminService);

  health = signal<SystemHealthResponse | null>(null);
  stats = signal<PlatformStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminService.systemHealth().subscribe({ next: (res) => this.health.set(res.data) });
    this.adminService.platformStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
}
