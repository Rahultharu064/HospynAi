import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface Plan {
  name: string;
  price: string;
  unit: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
}

@Component({
  selector: 'app-pricing',
  imports: [RouterLink, ScrollRevealDirective],
  template: `
    <section id="pricing" class="bg-navy-950 py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div appScrollReveal class="mx-auto max-w-2xl text-center">
          <p class="mkt-section-label justify-center">Pricing</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            Priced for one branch or fifty.
          </h2>
          <p class="mt-4 text-lg text-gray-400">
            Every plan includes patient records, scheduling, and billing. Upgrade when you're ready for AI voice,
            calling, and blockchain-anchored records.
          </p>
        </div>

        <div class="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          @for (plan of plans; track plan.name; let i = $index) {
            <div
              appScrollReveal
              [revealDelay]="i * 90"
              class="relative flex flex-col rounded-xl border p-8"
              [class.border-teal-400]="plan.featured"
              [class.bg-navy-900]="plan.featured"
              [class.shadow-glow-teal]="plan.featured"
              [class.border-navy-800]="!plan.featured"
              [class.bg-navy-900/50]="!plan.featured"
            >
              @if (plan.featured) {
                <span class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-400 px-3 py-1 font-mono text-2xs font-semibold uppercase tracking-widest text-navy-950">
                  Most popular
                </span>
              }

              <h3 class="font-display text-lg font-semibold text-white">{{ plan.name }}</h3>
              <p class="mt-2 text-sm text-gray-400">{{ plan.description }}</p>

              <p class="mt-6">
                <span class="font-display text-4xl font-semibold text-white">{{ plan.price }}</span>
                <span class="ml-1 text-sm text-gray-500">{{ plan.unit }}</span>
              </p>

              <ul class="mt-6 flex-1 space-y-3">
                @for (feature of plan.features; track feature) {
                  <li class="flex items-start gap-3 text-sm text-gray-300">
                    <span class="mt-0.5 text-teal-400">✓</span>
                    <span>{{ feature }}</span>
                  </li>
                }
              </ul>

              <a
                [routerLink]="plan.href"
                class="mt-8"
                [class.btn-console-primary]="plan.featured"
                [class.btn-console-secondary]="!plan.featured"
              >
                {{ plan.cta }}
              </a>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class PricingComponent {
  plans: Plan[] = [
    {
      name: 'Starter',
      price: '$49',
      unit: '/ provider / month',
      description: 'For a single clinic getting off paper.',
      features: [
        'Patients, appointments, and queue management',
        'Electronic medical records',
        'Billing and invoicing',
        'Up to 1 branch',
      ],
      cta: 'Start free trial',
      href: '/auth/register',
      featured: false,
    },
    {
      name: 'Growth',
      price: '$129',
      unit: '/ provider / month',
      description: 'For clinics ready to stop missing calls.',
      features: [
        'Everything in Starter',
        'Voice AI intake and 24/7 calling agent',
        'Analytics dashboards',
        'Up to 5 branches',
      ],
      cta: 'Start free trial',
      href: '/auth/register',
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      unit: 'billed annually',
      description: 'For hospital networks with real scale.',
      features: [
        'Everything in Growth',
        'Blockchain-anchored records',
        'RAG knowledge engine and AI memory',
        'Unlimited branches, dedicated support',
      ],
      cta: 'Talk to sales',
      href: '/auth/register',
      featured: false,
    },
  ];
}
