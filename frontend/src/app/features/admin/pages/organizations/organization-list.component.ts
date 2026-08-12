import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { OrganizationResponse } from '../../models/admin.model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SpinnerComponent } from '../../../../shared/components/spinner/spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, PageHeaderComponent, SpinnerComponent, EmptyStateComponent, BadgeComponent],
  template: `
    <app-page-header title="Administration" subtitle="Manage staff accounts, organizations, and system health." />

    <nav class="mb-6 flex gap-1 border-b border-gray-200">
      <a routerLink="/admin/users" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Staff</a>
      <a routerLink="/admin/organizations" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">Organizations</a>
      <a routerLink="/admin/system" routerLinkActive="border-navy-500 text-navy-600" class="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500">System health</a>
    </nav>

    @if (loading()) {
      <app-spinner />
    } @else if (orgs().length === 0) {
      <app-empty-state icon="🏥" title="No organizations yet" />
    } @else {
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        @for (o of orgs(); track o.id) {
          <div class="card p-5">
            <div class="mb-2 flex items-start justify-between">
              <h3 class="font-display text-base font-semibold text-gray-900">{{ o.name }}</h3>
              <app-badge [status]="o.status" />
            </div>
            <p class="mb-3 text-xs text-gray-400">{{ o.slug }}</p>
            <dl class="grid grid-cols-2 gap-2 text-sm">
              <div><dt class="text-gray-400">Users</dt><dd class="font-medium">{{ o.stats.totalUsers }}</dd></div>
              <div><dt class="text-gray-400">Patients</dt><dd class="font-medium">{{ o.stats.totalPatients }}</dd></div>
              <div><dt class="text-gray-400">Branches</dt><dd class="font-medium">{{ o.branches.length }}</dd></div>
              <div><dt class="text-gray-400">Plan</dt><dd class="font-medium">{{ o.subscription?.plan || '—' }}</dd></div>
            </dl>
          </div>
        }
      </div>
    }
  `,
})
export class OrganizationListComponent implements OnInit {
  private adminService = inject(AdminService);

  orgs = signal<OrganizationResponse[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.adminService.listOrganizations({ limit: 50 }).subscribe({
      next: (res) => {
        this.orgs.set(res.organizations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
