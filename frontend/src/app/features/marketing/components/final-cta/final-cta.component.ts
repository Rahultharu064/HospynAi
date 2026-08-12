import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { PulseLineComponent } from '../pulse-line/pulse-line.component';

@Component({
  selector: 'app-final-cta',
  imports: [RouterLink, ScrollRevealDirective, PulseLineComponent],
  template: `
    <section class="relative overflow-hidden bg-navy-950 py-24">
      <div
        class="pointer-events-none absolute left-1/2 top-1/2 h-96 w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl"
      ></div>

      <div appScrollReveal class="relative mx-auto max-w-3xl px-6 text-center">
        <h2 class="font-display text-display-md font-semibold text-white sm:text-display-lg">
          Give your hospital an operating system that's on when you're not.
        </h2>
        <p class="mx-auto mt-5 max-w-xl text-lg text-gray-400">
          Start a free trial in minutes, or talk to us about moving a multi-branch hospital over.
        </p>
        <div class="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a routerLink="/auth/register" class="btn-console-primary px-7 py-3 text-base">Start free trial</a>
          <a routerLink="/auth/login" class="btn-console-secondary px-7 py-3 text-base">Sign in</a>
        </div>
      </div>

      <div class="relative mx-auto mt-16 h-16 max-w-4xl px-6 opacity-70">
        <app-pulse-line />
      </div>
    </section>
  `,
})
export class FinalCtaComponent {}
