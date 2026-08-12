import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/overview/analytics-overview.component').then((m) => m.AnalyticsOverviewComponent),
    title: 'Analytics — VoiceMed Pro',
  },
];
