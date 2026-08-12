import { Routes } from '@angular/router';

export const PATIENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/list/patient-list.component').then((m) => m.PatientListComponent),
    title: 'Patients — VoiceMed Pro',
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/form/patient-form.component').then((m) => m.PatientFormComponent),
    title: 'New patient — VoiceMed Pro',
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/detail/patient-detail.component').then((m) => m.PatientDetailComponent),
    title: 'Patient details — VoiceMed Pro',
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/form/patient-form.component').then((m) => m.PatientFormComponent),
    title: 'Edit patient — VoiceMed Pro',
  },
];
