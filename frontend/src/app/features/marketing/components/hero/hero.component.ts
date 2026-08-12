import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PulseLineComponent } from '../pulse-line/pulse-line.component';

interface FeedRow {
  tag: string;
  text: string;
  meta: string;
}

@Component({
  selector: 'app-hero',
  imports: [RouterLink, PulseLineComponent],
  template: `
    <section id="top" class="relative overflow-hidden bg-navy-950 pb-20 pt-36 sm:pb-28 sm:pt-44">
      <!-- ambient console grid + glow -->
      <div class="pointer-events-none absolute inset-0 bg-console-grid bg-console-grid opacity-40"></div>
      <div
        class="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-500/10 blur-3xl"
      ></div>
      <div
        class="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"
      ></div>

      <div class="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <div class="mkt-hero-in">
          <span class="mkt-eyebrow">
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75"></span>
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300"></span>
            </span>
            System status · All systems operational
          </span>

          <h1 class="mt-6 font-display text-display-md font-semibold leading-[1.05] text-white sm:text-display-lg">
            One operating system for the hospital that never stops running.
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            Voice AI answers the phone at 3am. Agentic workflows book the visit, route the patient, and update the
            chart before your front desk opens for the day. VoiceMed Pro runs scheduling, records, billing, and
            patient calls — around the clock, across every branch.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a routerLink="/auth/register" class="btn-console-primary px-6 py-3 text-base">Start free trial</a>
            <a href="#how-it-works" class="btn-console-secondary px-6 py-3 text-base">See how it works</a>
          </div>

          <p class="mt-6 font-mono text-2xs uppercase tracking-widest text-gray-500">
            HIPAA-ready infrastructure · Blockchain-anchored records · Built for multi-branch hospitals
          </p>
        </div>

        <div class="mkt-hero-in mkt-hero-in--delay">
          <div class="mkt-panel overflow-hidden">
            <div class="flex items-center justify-between border-b border-navy-800 px-5 py-3">
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full bg-danger-500/70"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-warning-500/70"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-success-500/70"></span>
              </div>
              <span class="font-mono text-2xs uppercase tracking-widest text-gray-500">Live operations feed</span>
            </div>

            <ul class="h-72 space-y-1 overflow-hidden px-4 py-4">
              @for (row of visibleRows(); track row.text; let i = $index) {
                <li
                  class="flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors"
                  [class.bg-navy-800/60]="i === 0"
                >
                  <span class="mkt-tag shrink-0">{{ row.tag }}</span>
                  <span class="min-w-0 flex-1 truncate text-sm text-gray-300">{{ row.text }}</span>
                  <span class="shrink-0 font-mono text-2xs text-gray-500">{{ row.meta }}</span>
                </li>
              }
            </ul>

            <div class="grid grid-cols-3 divide-x divide-navy-800 border-t border-navy-800">
              <div class="px-4 py-3 text-center">
                <p class="font-mono text-sm font-semibold text-teal-300">99.98%</p>
                <p class="mt-0.5 font-mono text-2xs uppercase tracking-widest text-gray-500">Uptime</p>
              </div>
              <div class="px-4 py-3 text-center">
                <p class="font-mono text-sm font-semibold text-teal-300">&lt;2s</p>
                <p class="mt-0.5 font-mono text-2xs uppercase tracking-widest text-gray-500">API p95</p>
              </div>
              <div class="px-4 py-3 text-center">
                <p class="font-mono text-sm font-semibold text-teal-300">24/7</p>
                <p class="mt-0.5 font-mono text-2xs uppercase tracking-widest text-gray-500">AI coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative mt-20 h-16 opacity-70" style="--pulse-base-color: rgba(45, 212, 191, 0.08)">
        <app-pulse-line />
      </div>
    </section>
  `,
  styles: [
    `
      .mkt-hero-in {
        opacity: 0;
        transform: translateY(18px);
        animation: hero-in 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .mkt-hero-in--delay {
        animation-delay: 160ms;
      }

      @keyframes hero-in {
        to {
          opacity: 1;
          transform: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .mkt-hero-in {
          animation: none;
          opacity: 1;
          transform: none;
        }
      }
    `,
  ],
})
export class HeroComponent implements OnInit, OnDestroy {
  private readonly feed: FeedRow[] = [
    { tag: 'AI CALL', text: 'Answered inbound call, routed to Dr. Sharma', meta: '00:42' },
    { tag: 'BOOKING', text: 'Appointment confirmed for patient PT-2291', meta: 'Cardiology' },
    { tag: 'EMR', text: 'Record signed and anchored to blockchain', meta: 'Block #48213' },
    { tag: 'QUEUE', text: 'Token A-014 called at Reception', meta: '6 min wait' },
    { tag: 'BILLING', text: 'Invoice INV-3390 marked as paid', meta: '$140.00' },
    { tag: 'AI CALL', text: 'After-hours call triaged, no human handoff needed', meta: '01:58' },
    { tag: 'RAG', text: 'Drug interaction check completed for prescription', meta: '0 conflicts' },
  ];

  visibleRows = signal<FeedRow[]>(this.feed.slice(0, 5));
  private cursor = 5;
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    this.intervalId = setInterval(() => {
      const next = this.feed[this.cursor % this.feed.length];
      this.cursor++;
      this.visibleRows.update((rows) => [next, ...rows.slice(0, 4)]);
    }, 2600);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
