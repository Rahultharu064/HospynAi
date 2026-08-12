import { Component } from '@angular/core';
import { CountUpDirective } from '../../../../shared/directives/count-up.directive';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface Metric {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  caption: string;
}

@Component({
  selector: 'app-metric-strip',
  imports: [CountUpDirective, ScrollRevealDirective],
  template: `
    <section class="border-y border-navy-800 bg-navy-900/40 py-14">
      <div class="mx-auto max-w-7xl px-6">
        <div class="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:divide-x lg:divide-navy-800">
          @for (metric of metrics; track metric.label; let i = $index) {
            <div appScrollReveal [revealDelay]="i * 80" class="text-center lg:px-6">
              <p class="font-mono text-4xl font-semibold text-white">
                <span
                  [appCountUp]="metric.value"
                  [countPrefix]="metric.prefix ?? ''"
                  [countSuffix]="metric.suffix ?? ''"
                  [countDecimals]="metric.decimals ?? 0"
                  >0</span
                >
              </p>
              <p class="mt-2 text-sm font-medium text-gray-300">{{ metric.label }}</p>
              <p class="mt-1 font-mono text-2xs uppercase tracking-widest text-gray-600">{{ metric.caption }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class MetricStripComponent {
  metrics: Metric[] = [
    { value: 70, suffix: '%', label: 'Fewer manual bookings', caption: 'vs. front-desk-only intake' },
    { value: 50, suffix: '%', label: 'Fewer missed calls', caption: 'with 24/7 AI calling' },
    { value: 99.9, decimals: 1, suffix: '%', label: 'Platform uptime SLA', caption: 'monitored around the clock' },
    { value: 2, prefix: '<', suffix: 's', label: 'API response time', caption: 'p95, under normal load' },
  ];
}
