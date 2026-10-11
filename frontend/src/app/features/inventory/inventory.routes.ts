import { Routes } from '@angular/router';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/overview/inventory-overview.component').then((m) => m.InventoryOverviewComponent),
    title: 'Inventory — VoiceMed Pro',
  },
];
