import { Injectable, signal } from '@angular/core';
import { UserRole } from '../models/user.model';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[];
}

const ALL_STAFF: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN'];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠', roles: [...ALL_STAFF, 'PATIENT'] },
  { label: 'Patients', path: '/patients', icon: '🧑‍⚕️', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { label: 'Appointments', path: '/appointments', icon: '📅', roles: [...ALL_STAFF, 'PATIENT'] },
  { label: 'My Records', path: '/emr', icon: '📋', roles: ['PATIENT'] },
  { label: 'EMR', path: '/emr', icon: '📋', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE'] },
  { label: 'Billing', path: '/billing', icon: '💳', roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Inventory', path: '/inventory', icon: '💊', roles: ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'] },
  { label: 'Analytics', path: '/analytics', icon: '📊', roles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'] },
  { label: 'Administration', path: '/admin', icon: '⚙️', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

@Injectable({ providedIn: 'root' })
export class NavService {
  /** Whether the off-canvas sidebar drawer is open on mobile/tablet widths. */
  readonly mobileSidebarOpen = signal(false);

  itemsForRole(role: UserRole | null): NavItem[] {
    if (!role) return [];
    return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((open) => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
