import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface Module {
  tag: string;
  icon: string;
  title: string;
  description: string;
  accent: 'teal' | 'indigo';
}

@Component({
  selector: 'app-capability-grid',
  imports: [ScrollRevealDirective],
  template: `
    <section id="platform" class="bg-navy-950 py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div appScrollReveal class="max-w-2xl">
          <p class="mkt-section-label">Console modules</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            Every subsystem your hospital runs on, in one console.
          </h2>
          <p class="mt-4 text-lg text-gray-400">
            Each module runs independently and talks to the others — a call the AI answers at midnight becomes a
            booked slot, a chart update, and an invoice, without anyone re-typing it.
          </p>
        </div>

        <div class="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative">
          <!-- background glow for the grid -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-teal-900/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          @for (module of modules; track module.title; let i = $index) {
            <div
              appScrollReveal
              [revealDelay]="(i % 3) * 90"
              class="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-slower ease-out hover:-translate-y-2 hover:shadow-2xl"
              [class.hover:shadow-glow-teal]="module.accent === 'teal'"
              [class.hover:shadow-glow-indigo]="module.accent === 'indigo'"
            >
              <!-- Animated gradient border mask -->
              <div class="absolute inset-0 bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity duration-slower"
                   [class.from-teal-500]="module.accent === 'teal'"
                   [class.to-teal-900]="module.accent === 'teal'"
                   [class.from-indigo-500]="module.accent === 'indigo'"
                   [class.to-indigo-900]="module.accent === 'indigo'"
                   [class.via-navy-900]="true">
              </div>
              
              <!-- Card content container -->
              <div class="relative h-full mkt-panel bg-navy-950/95 backdrop-blur-xl p-8 rounded-2xl border-none">
                <!-- Inner glow on hover -->
                <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-slower"
                     [class.bg-teal-400]="module.accent === 'teal'"
                     [class.bg-indigo-400]="module.accent === 'indigo'">
                </div>

                <div class="flex items-center justify-between relative z-10">
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-900 border transition-transform duration-moderate group-hover:scale-110"
                       [class.border-teal-500/30]="module.accent === 'teal'"
                       [class.border-indigo-500/30]="module.accent === 'indigo'">
                    <span class="text-2xl">{{ module.icon }}</span>
                  </div>
                  <span class="mkt-tag transition-colors duration-moderate group-hover:bg-navy-800" 
                        [class.!text-teal-300]="module.accent === 'teal'" 
                        [class.!border-teal-500/50]="module.accent === 'teal'"
                        [class.!text-indigo-300]="module.accent === 'indigo'"
                        [class.!border-indigo-500/50]="module.accent === 'indigo'">
                    {{ module.tag }}
                  </span>
                </div>
                
                <h3 class="mt-6 font-display text-xl font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-moderate"
                    [class.from-teal-300]="module.accent === 'teal'"
                    [class.to-white]="module.accent === 'teal'"
                    [class.from-indigo-300]="module.accent === 'indigo'"
                    [class.to-white]="module.accent === 'indigo'">
                  {{ module.title }}
                </h3>
                
                <p class="mt-3 text-sm leading-relaxed text-gray-400 relative z-10">
                  {{ module.description }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class CapabilityGridComponent {
  modules: Module[] = [
    {
      tag: 'Agentic',
      icon: '🧠',
      title: 'Agentic AI orchestration',
      description:
        'LangGraph-driven workflows plan and execute multi-step tasks — scheduling, triage, follow-ups — without a human clicking through every screen.',
      accent: 'indigo',
    },
    {
      tag: 'Voice',
      icon: '🎙️',
      title: 'Voice intake & triage',
      description:
        'Patients speak naturally; Whisper and GPT-4o turn it into structured intake, symptom notes, and a booked slot in seconds.',
      accent: 'teal',
    },
    {
      tag: 'Calling',
      icon: '📞',
      title: '24/7 AI calling agent',
      description:
        'Every inbound call gets answered — day, night, and holidays — with clean handoff to a human whenever the AI hits its limit.',
      accent: 'teal',
    },
    {
      tag: 'Security',
      icon: '🔗',
      title: 'Blockchain-anchored records',
      description:
        'Signed medical records are hashed and anchored on Polygon, giving every chart a tamper-evident, independently verifiable trail.',
      accent: 'indigo',
    },
    {
      tag: 'Knowledge',
      icon: '📚',
      title: 'RAG knowledge engine',
      description:
        'Clinical questions get answered from your own protocols and formularies, grounded in real sources instead of a guess.',
      accent: 'indigo',
    },
    {
      tag: 'Memory',
      icon: '🧬',
      title: 'Longitudinal AI memory',
      description:
        'Context about a patient persists across visits and channels, so the AI — and your staff — never start from zero.',
      accent: 'teal',
    },
  ];
}
