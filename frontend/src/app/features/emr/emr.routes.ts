import { Routes } from '@angular/router';

export const EMR_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/list/emr-lookup.component').then((m) => m.EmrLookupComponent),
    title: 'Medical Records — VoiceMed Pro',
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/form/emr-form.component').then((m) => m.EmrFormComponent),
    title: 'New medical record — VoiceMed Pro',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/detail/emr-detail.component').then((m) => m.EmrDetailComponent),
    title: 'Medical record — VoiceMed Pro',
  },
];
