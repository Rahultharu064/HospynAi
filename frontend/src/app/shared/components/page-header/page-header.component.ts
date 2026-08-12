import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-display-sm font-display font-semibold text-gray-900">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-sm text-gray-500">{{ subtitle }}</p>
        }
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
