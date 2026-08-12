import { Component } from '@angular/core';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

@Component({
  selector: 'app-marketing-footer',
  template: `
    <footer class="border-t border-navy-800 bg-navy-950 pt-16">
      <div class="mx-auto max-w-7xl px-6">
        <div class="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div class="col-span-2 lg:col-span-2">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-md bg-teal-400 text-sm font-bold text-navy-950">
                V
              </span>
              <span class="font-display text-lg font-semibold text-white">VoiceMed Pro</span>
            </div>
            <p class="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
              The AI operating system for hospitals and clinics — scheduling, records, billing, and 24/7 patient
              calls, running as one system.
            </p>
          </div>

          @for (column of columns; track column.title) {
            <div>
              <h3 class="font-mono text-2xs uppercase tracking-widest text-gray-500">{{ column.title }}</h3>
              <ul class="mt-4 space-y-3">
                @for (link of column.links; track link.label) {
                  <li>
                    <a [href]="link.href" class="text-sm text-gray-400 transition-colors hover:text-teal-300">
                      {{ link.label }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <div class="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy-800 py-6 sm:flex-row">
          <p class="font-mono text-2xs text-gray-600">© {{ year }} VoiceMed Pro. All rights reserved.</p>
          <p class="flex items-center gap-2 font-mono text-2xs uppercase tracking-widest text-gray-600">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60"></span>
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500"></span>
            </span>
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class MarketingFooterComponent {
  year = new Date().getFullYear();

  columns: FooterColumn[] = [
    {
      title: 'Platform',
      links: [
        { label: 'Console modules', href: '#platform' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Security', href: '#security' },
        { label: 'Pricing', href: '#pricing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'FAQ', href: '#faq' },
        { label: 'Sign in', href: '/auth/login' },
        { label: 'Start free trial', href: '/auth/register' },
      ],
    },
  ];
}
