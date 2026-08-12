import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { PulseLineComponent } from '../pulse-line/pulse-line.component';

interface Step {
  index: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  imports: [ScrollRevealDirective, PulseLineComponent],
  template: `
    <section id="how-it-works" class="relative overflow-hidden bg-navy-900/40 py-24">
      <div class="mx-auto max-w-5xl px-6">
        <div appScrollReveal class="max-w-2xl">
          <p class="mkt-section-label">The path of one visit</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            From a ringing phone to a signed, billed record.
          </h2>
        </div>

        <div class="relative mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-[auto_1fr]">
          <div class="hidden self-stretch sm:block sm:w-16">
            <div class="sticky top-24 h-[calc(100%-1.5rem)]">
              <app-pulse-line orientation="vertical" />
            </div>
          </div>

          <ol class="contents sm:block sm:space-y-12">
            @for (step of steps; track step.index; let i = $index) {
              <li appScrollReveal [revealDelay]="i * 100" class="relative flex gap-5 sm:gap-6">
                <span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-400/40 bg-navy-950 font-mono text-sm font-semibold text-teal-300"
                >
                  {{ step.index }}
                </span>
                <div class="mkt-panel flex-1 p-6">
                  <h3 class="font-display text-lg font-semibold text-white">{{ step.title }}</h3>
                  <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ step.description }}</p>
                </div>
              </li>
            }
          </ol>
        </div>
      </div>
    </section>
  `,
})
export class HowItWorksComponent {
  steps: Step[] = [
    {
      index: '01',
      title: 'A patient reaches out',
      description:
        'By phone, voice, or the booking widget — any hour, any day. The AI answers, understands the request, and starts the record.',
    },
    {
      index: '02',
      title: 'The AI agent triages and routes',
      description:
        'Symptoms are checked against urgency rules, the right doctor and branch are matched, and a real slot is booked from live availability.',
    },
    {
      index: '03',
      title: 'Your team works from a ready chart',
      description:
        'Vitals, intake notes, and history are already structured in the EMR by the time the patient sits down — nothing to re-transcribe.',
    },
    {
      index: '04',
      title: 'The visit closes itself out',
      description:
        'The signed record is hashed and anchored on-chain, the invoice goes out, and a follow-up reminder is scheduled automatically.',
    },
  ];
}
