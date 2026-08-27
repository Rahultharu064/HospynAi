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
          <span class="mkt-eyebrow group relative overflow-hidden bg-navy-950/50 hover:bg-navy-900/80 transition-colors">
            <span class="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-slower"></span>
            <span class="relative flex h-1.5 w-1.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400"></span>
            </span>
            System status · All systems operational
          </span>

          <h1 class="mt-8 font-display text-display-md font-semibold leading-[1.05] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-navy-200 sm:text-display-lg tracking-tight">
            One operating system for the hospital that never stops running.
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-navy-200/90 font-light">
            Voice AI answers the phone at 3am. Agentic workflows book the visit, route the patient, and update the
            chart before your front desk opens for the day. VoiceMed Pro runs scheduling, records, billing, and
            patient calls — around the clock, across every branch.
          </p>

          <div class="mt-10 flex flex-col gap-4 sm:flex-row">
            <a routerLink="/auth/register" class="btn-console-primary px-8 py-3.5 text-base shadow-glow-teal hover:scale-[1.02] active:scale-95 transition-all">Start free trial</a>
            <a href="#how-it-works" class="btn-console-secondary px-8 py-3.5 text-base hover:bg-navy-800 transition-colors">See how it works</a>
          </div>

          <p class="mt-8 font-mono text-2xs uppercase tracking-[0.2em] text-navy-400/80 flex items-center flex-wrap gap-x-3 gap-y-2">
            <span>HIPAA-ready</span>
            <span class="h-1 w-1 rounded-full bg-navy-600"></span>
            <span>Blockchain-anchored</span>
            <span class="h-1 w-1 rounded-full bg-navy-600"></span>
            <span>Multi-branch</span>
          </p>
        </div>

        <div class="mkt-hero-in mkt-hero-in--delay relative">
          <!-- decorative frame around the panel -->
          <div class="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-teal-500/30 via-navy-800/0 to-indigo-500/30 opacity-50 blur-[2px]"></div>
          
          <div class="mkt-panel overflow-hidden relative z-10 bg-navy-950/80 backdrop-blur-2xl border-navy-700/50 shadow-2xl">
            <div class="flex items-center justify-between border-b border-navy-800/80 bg-navy-900/50 px-5 py-3.5">
              <div class="flex items-center gap-2">
                <span class="h-3 w-3 rounded-full bg-danger-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                <span class="h-3 w-3 rounded-full bg-warning-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                <span class="h-3 w-3 rounded-full bg-success-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </div>
              <span class="font-mono text-[10px] uppercase tracking-widest text-navy-300 flex items-center gap-2">
                <span class="relative flex h-1.5 w-1.5">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75"></span>
                  <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-400"></span>
                </span>
                Live operations feed
              </span>
            </div>

            <ul class="h-72 space-y-1.5 overflow-hidden px-4 py-4 relative">
              <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-950/90 to-transparent pointer-events-none z-10"></div>
              @for (row of visibleRows(); track row.text; let i = $index) {
                <li
                  class="flex items-start gap-3 rounded-lg px-3 py-3 transition-all duration-slower"
                  [class.bg-navy-800/80]="i === 0"
                  [class.shadow-md]="i === 0"
                  [class.border]="i === 0"
                  [class.border-navy-700]="i === 0"
                  [class.opacity-100]="i === 0"
                  [class.opacity-70]="i === 1"
                  [class.opacity-40]="i > 1"
                >
                  <span class="mkt-tag shrink-0 !text-[10px]" [class.!bg-teal-500/10]="i === 0" [class.!text-teal-300]="i === 0" [class.!border-teal-500/30]="i === 0">{{ row.tag }}</span>
                  <span class="min-w-0 flex-1 truncate text-sm" [class.text-white]="i === 0" [class.font-medium]="i === 0" [class.text-gray-300]="i !== 0">{{ row.text }}</span>
                  <span class="shrink-0 font-mono text-[10px]" [class.text-teal-400]="i === 0" [class.text-gray-500]="i !== 0">{{ row.meta }}</span>
                </li>
              }
            </ul>

            <div class="grid grid-cols-3 divide-x divide-navy-800/80 border-t border-navy-800/80 bg-navy-900/30 backdrop-blur-sm">
              <div class="px-4 py-4 text-center group hover:bg-navy-800/50 transition-colors cursor-default">
                <p class="font-mono text-sm font-semibold text-teal-300 group-hover:scale-105 transition-transform">99.98%</p>
                <p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-navy-400">Uptime</p>
              </div>
              <div class="px-4 py-4 text-center group hover:bg-navy-800/50 transition-colors cursor-default">
                <p class="font-mono text-sm font-semibold text-indigo-300 group-hover:scale-105 transition-transform">&lt;2s</p>
                <p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-navy-400">API p95</p>
              </div>
              <div class="px-4 py-4 text-center group hover:bg-navy-800/50 transition-colors cursor-default">
                <p class="font-mono text-sm font-semibold text-teal-300 group-hover:scale-105 transition-transform">24/7</p>
                <p class="mt-1 font-mono text-[10px] uppercase tracking-widest text-navy-400">Coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative mt-24 h-16 opacity-80" style="--pulse-base-color: rgba(45, 212, 191, 0.15)">
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
