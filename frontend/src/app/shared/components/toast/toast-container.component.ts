import { Component, inject } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-toast-container',
    imports: [],
    template: `
    <div class="pointer-events-none fixed inset-x-0 top-4 z-toast flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      @for (t of toastService.toasts(); track t.id) {
        <div
          class="pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-moderate"
          [class]="variantClasses[t.variant]"
          role="alert"
        >
          <div class="flex items-start justify-between gap-3">
            <p class="font-medium">{{ t.message }}</p>
            <button
              type="button"
              class="shrink-0 text-current opacity-60 hover:opacity-100"
              (click)="toastService.dismiss(t.id)"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  readonly variantClasses: Record<string, string> = {
    success: 'border-success-500 bg-success-50 text-success-700',
    error: 'border-danger-500 bg-danger-50 text-danger-700',
    warning: 'border-warning-500 bg-warning-50 text-warning-700',
    info: 'border-navy-500 bg-navy-50 text-navy-700',
  };
}
