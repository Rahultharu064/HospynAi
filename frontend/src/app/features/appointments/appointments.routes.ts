import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/list/appointment-list.component').then((m) => m.AppointmentListComponent),
    title: 'Appointments — VoiceMed Pro',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/form/appointment-form.component').then((m) => m.AppointmentFormComponent),
    title: 'Book appointment — VoiceMed Pro',
  },
  {
    path: 'queue',
    loadComponent: () => import('./pages/queue/queue-board.component').then((m) => m.QueueBoardComponent),
    title: 'Live queue — VoiceMed Pro',
  },
];
