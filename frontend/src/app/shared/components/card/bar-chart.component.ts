import { Component, Input, computed, signal } from '@angular/core';


export interface BarDatum {
  label: string;
  value: number;
}

@Component({
    selector: 'app-bar-chart',
    imports: [],
    template: `
    <div class="space-y-2">
      @for (d of items(); track d.label) {
        <div class="flex items-center gap-3 text-sm">
          <span class="w-24 shrink-0 truncate text-gray-500">{{ d.label }}</span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div class="h-full rounded-full bg-navy-500" [style.width.%]="pct(d.value)"></div>
          </div>
          <span class="w-10 shrink-0 text-right font-medium text-gray-900">{{ d.value }}</span>
        </div>
      }
    </div>
  `
})
export class BarChartComponent {
  private readonly _data = signal<BarDatum[]>([]);

  @Input({ required: true }) set data(value: BarDatum[]) {
    this._data.set(value ?? []);
  }

  items = computed(() => this._data());
  max = computed(() => Math.max(1, ...this._data().map((d) => d.value)));

  pct(value: number): number {
    return (value / this.max()) * 100;
  }
}
