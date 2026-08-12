import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  org: string;
}

@Component({
  selector: 'app-testimonials',
  imports: [ScrollRevealDirective],
  template: `
    <section class="bg-navy-900/40 py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div appScrollReveal class="max-w-2xl">
          <p class="mkt-section-label">What early teams say</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            Illustrative feedback from pilot deployments.
          </h2>
        </div>

        <div class="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          @for (t of testimonials; track t.name; let i = $index) {
            <figure appScrollReveal [revealDelay]="i * 90" class="mkt-panel flex h-full flex-col p-6">
              <span class="font-mono text-2xs text-teal-300">&gt;_</span>
              <blockquote class="mt-3 flex-1 text-sm leading-relaxed text-gray-300">"{{ t.quote }}"</blockquote>
              <figcaption class="mt-6 border-t border-navy-800 pt-4">
                <p class="text-sm font-semibold text-white">{{ t.name }}</p>
                <p class="mt-0.5 font-mono text-2xs uppercase tracking-widest text-gray-500">{{ t.role }} · {{ t.org }}</p>
              </figcaption>
            </figure>
          }
        </div>
      </div>
    </section>
  `,
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      quote:
        'Our front desk used to lose calls every night after 7pm. Now the AI answers, books the slot, and we see it on the schedule before we even open the next morning.',
      name: 'Amara K.',
      role: 'Clinic Operations Manager',
      org: 'Sunridge Medical Group',
    },
    {
      quote:
        'I stopped re-typing intake notes. By the time I call the patient in, the chart already has their history and vitals structured and ready.',
      name: 'Dr. Rohan V.',
      role: 'Attending Physician',
      org: 'Harbor View Clinic',
    },
    {
      quote:
        'Being able to show auditors a blockchain-anchored record instead of a spreadsheet of edit logs changed that conversation completely.',
      name: 'Priya D.',
      role: 'Compliance Lead',
      org: 'Meridian Health Partners',
    },
  ];
}
