import { Component, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [ScrollRevealDirective],
  template: `
    <section id="faq" class="bg-navy-900/40 py-24">
      <div class="mx-auto max-w-3xl px-6">
        <div appScrollReveal>
          <p class="mkt-section-label">Questions</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            Before you ask sales.
          </h2>
        </div>

        <div appScrollReveal [revealDelay]="80" class="mt-10 divide-y divide-navy-800 border-y border-navy-800">
          @for (item of items; track item.question; let i = $index) {
            <div>
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 py-5 text-left"
                (click)="toggle(i)"
                [attr.aria-expanded]="openIndex() === i"
              >
                <span class="font-display text-base font-medium text-white">{{ item.question }}</span>
                <span
                  class="shrink-0 font-mono text-lg text-teal-300 transition-transform duration-fast"
                  [class.rotate-45]="openIndex() === i"
                >
                  +
                </span>
              </button>
              @if (openIndex() === i) {
                <p class="pb-5 pr-10 text-sm leading-relaxed text-gray-400">{{ item.answer }}</p>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class FaqComponent {
  openIndex = signal<number | null>(0);

  toggle(i: number): void {
    this.openIndex.set(this.openIndex() === i ? null : i);
  }

  items: FaqItem[] = [
    {
      question: 'Is VoiceMed Pro HIPAA-ready?',
      answer:
        'Yes. Data is encrypted in transit and at rest, access is role-scoped, and every sensitive action is captured in an audit log by default.',
    },
    {
      question: 'Do we need every module, or can we start small?',
      answer:
        'Start with patients, scheduling, and billing on the Starter plan. Voice AI, the calling agent, and blockchain-anchored records are available whenever you upgrade — no migration required.',
    },
    {
      question: 'What happens to our data if we anchor records on-chain?',
      answer:
        'Only a cryptographic hash of the signed record is anchored on Polygon — the chart itself stays in your database. The hash simply proves it hasn\'t been altered.',
    },
    {
      question: 'Can the AI calling agent hand off to a human?',
      answer:
        'Yes, at any point the AI is unsure or the caller asks, the call transfers to your front desk or on-call staff with full context already captured.',
    },
    {
      question: 'How long is the free trial?',
      answer:
        'Free trials run 14 days with full access to your plan\'s features. No card required to start.',
    },
  ];
}
