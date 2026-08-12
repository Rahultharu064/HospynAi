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

        <div class="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          @for (module of modules; track module.title; let i = $index) {
            <div
              appScrollReveal
              [revealDelay]="(i % 3) * 90"
              class="group mkt-panel relative overflow-hidden p-6 transition-all duration-moderate hover:-translate-y-1"
              [class.hover:shadow-glow-teal]="module.accent === 'teal'"
              [class.hover:shadow-glow-indigo]="module.accent === 'indigo'"
            >
              <div class="flex items-center justify-between">
                <span class="text-2xl">{{ module.icon }}</span>
                <span class="mkt-tag" [class.!text-teal-300]="module.accent === 'teal'" [class.!text-indigo-300]="module.accent === 'indigo'">
                  {{ module.tag }}
                </span>
              </div>
              <h3 class="mt-5 font-display text-lg font-semibold text-white">{{ module.title }}</h3>
              <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ module.description }}</p>
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
