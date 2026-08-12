import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface SecurityPoint {
  title: string;
  description: string;
}

@Component({
  selector: 'app-security-band',
  imports: [ScrollRevealDirective],
  template: `
    <section id="security" class="relative overflow-hidden bg-indigo-900/20 py-24">
      <div class="pointer-events-none absolute inset-0 bg-console-grid bg-console-grid opacity-20"></div>

      <div class="relative mx-auto max-w-7xl px-6">
        <div class="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div appScrollReveal>
            <p class="mkt-section-label !text-indigo-300">Security & compliance</p>
            <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
              Every record leaves a trail nobody can quietly edit.
            </h2>
            <p class="mt-4 text-lg text-gray-400">
              When a doctor signs a record, VoiceMed Pro hashes it and anchors that hash on Polygon. The chart itself
              never leaves your database — only a fingerprint does, giving you independent proof it hasn't been
              altered.
            </p>

            <dl class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              @for (point of points; track point.title) {
                <div>
                  <dt class="font-display text-base font-semibold text-white">{{ point.title }}</dt>
                  <dd class="mt-1.5 text-sm leading-relaxed text-gray-400">{{ point.description }}</dd>
                </div>
              }
            </dl>
          </div>

          <div appScrollReveal [revealDelay]="120" class="mkt-panel p-6 sm:p-8">
            <p class="font-mono text-2xs uppercase tracking-widest text-gray-500">Chain of custody</p>
            <div class="mt-6 space-y-0">
              @for (block of chain; track block.hash; let last = $last) {
                <div>
                  <div class="flex items-center gap-4 rounded-lg border border-navy-700 bg-navy-950/80 px-4 py-3">
                    <span class="h-2 w-2 shrink-0 rounded-full bg-indigo-400"></span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-mono text-xs text-indigo-200">{{ block.hash }}</p>
                      <p class="mt-0.5 text-xs text-gray-500">{{ block.label }}</p>
                    </div>
                    <span class="mkt-tag !text-indigo-300 shrink-0">Verified</span>
                  </div>
                  @if (!last) {
                    <div class="ml-[1.15rem] h-4 w-px bg-gradient-to-b from-indigo-400/60 to-indigo-400/10"></div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SecurityBandComponent {
  points: SecurityPoint[] = [
    {
      title: 'Blockchain-anchored records',
      description: 'Signed EMR entries are hashed and anchored on Polygon for tamper-evident verification.',
    },
    {
      title: 'Role-based access control',
      description: 'Every screen and action is scoped to what a role should actually be able to see or do.',
    },
    {
      title: 'Full audit logging',
      description: 'Every sensitive action is recorded automatically — no one has to remember to log it.',
    },
    {
      title: 'HIPAA-ready infrastructure',
      description: 'Encryption in transit and at rest, with data handling built around healthcare compliance.',
    },
  ];

  chain = [
    { hash: '0x8f3a…c91d', label: 'Medical record signed · Dr. Sharma' },
    { hash: '0x2b7e…44f0', label: 'Prescription issued · Patient PT-2291' },
    { hash: '0xd914…7ab2', label: 'Lab report finalized · Cardiology' },
  ];
}
