import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/user-management.component').then((m) => m.UserManagementComponent),
    title: 'Staff & users — VoiceMed Pro',
  },
  {
    path: 'organizations',
    loadComponent: () =>
      import('./pages/organizations/organization-list.component').then((m) => m.OrganizationListComponent),
    title: 'Organizations — VoiceMed Pro',
  },
  {
    path: 'system',
    loadComponent: () => import('./pages/system/system-health.component').then((m) => m.SystemHealthComponent),
    title: 'System health — VoiceMed Pro',
  },
];
