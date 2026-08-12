import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center" [class.py-12]="!inline">
      <div
        class="animate-spin rounded-full border-2 border-gray-200 border-t-navy-500"
        [style.width.px]="size"
        [style.height.px]="size"
      ></div>
    </div>
  `,
})
export class SpinnerComponent {
  @Input() size = 32;
  @Input() inline = false;
}
