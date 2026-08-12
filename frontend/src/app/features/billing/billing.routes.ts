import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/list/payment-list.component').then((m) => m.PaymentListComponent),
    title: 'Billing — VoiceMed Pro',
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/form/payment-form.component').then((m) => m.PaymentFormComponent),
    title: 'New invoice — VoiceMed Pro',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/detail/payment-detail.component').then((m) => m.PaymentDetailComponent),
    title: 'Invoice — VoiceMed Pro',
  },
];
