import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import { PulseLineComponent } from '../pulse-line/pulse-line.component';

@Component({
  selector: 'app-final-cta',
  imports: [RouterLink, ScrollRevealDirective, PulseLineComponent],
  template: `
    <section class="relative overflow-hidden bg-navy-950 py-28 border-t border-navy-900/50">
      <div class="pointer-events-none absolute inset-0 bg-console-grid opacity-20"></div>
      
      <div class="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[100px] mix-blend-screen"></div>

      <div appScrollReveal class="relative mx-auto max-w-4xl px-6 text-center z-10">
        <span class="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-teal-300 mb-8 backdrop-blur-sm">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-teal-400"></span>
          </span>
          Ready to deploy
        </span>
        
        <h2 class="font-display text-display-md font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 sm:text-display-lg tracking-tight leading-[1.1]">
          Give your hospital an operating system that's on when you're not.
        </h2>
        <p class="mx-auto mt-6 max-w-2xl text-xl text-gray-400 font-light leading-relaxed">
          Start a free trial in minutes, or talk to us about moving a multi-branch hospital over.
        </p>
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a routerLink="/auth/register" class="btn-console-primary px-8 py-4 text-base shadow-glow-teal hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto">Start free trial</a>
          <a routerLink="/auth/login" class="btn-console-secondary px-8 py-4 text-base hover:bg-navy-800 transition-colors w-full sm:w-auto">Sign in to console</a>
        </div>
      </div>

      <div class="relative mx-auto mt-24 h-16 max-w-5xl px-6 opacity-60 mix-blend-screen">
        <app-pulse-line />
      </div>
    </section>
  `,
})
export class FinalCtaComponent {}
