import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./layout/shell/auth-layout.component').then((m) => m.AuthLayoutComponent),
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/overview/dashboard-overview.component').then(
            (m) => m.DashboardOverviewComponent
          ),
        title: 'Dashboard — VoiceMed Pro',
      },
      {
        path: 'settings/profile',
        loadComponent: () => import('./features/settings/pages/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'My profile — VoiceMed Pro',
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patients.routes').then((m) => m.PATIENTS_ROUTES),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
      },
      {
        path: 'emr',
        loadChildren: () => import('./features/emr/emr.routes').then((m) => m.EMR_ROUTES),
      },
      {
        path: 'billing',
        loadChildren: () => import('./features/billing/billing.routes').then((m) => m.BILLING_ROUTES),
      },
      {
        path: 'analytics',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN', 'DOCTOR'])],
        loadChildren: () => import('./features/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
