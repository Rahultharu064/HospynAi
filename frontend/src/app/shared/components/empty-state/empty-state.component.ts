import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div class="text-4xl">{{ icon }}</div>
      <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
      @if (description) {
        <p class="max-w-sm text-sm text-gray-500">{{ description }}</p>
      }
      <div class="mt-3">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'Nothing here yet';
  @Input() description = '';
}
