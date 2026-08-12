import { Component, signal } from '@angular/core';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';

interface RoleTab {
  id: string;
  label: string;
  headline: string;
  description: string;
  points: string[];
}

@Component({
  selector: 'app-role-tabs',
  imports: [ScrollRevealDirective],
  template: `
    <section class="bg-navy-950 py-24">
      <div class="mx-auto max-w-6xl px-6">
        <div appScrollReveal class="max-w-2xl">
          <p class="mkt-section-label">Built for the whole team</p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-white sm:text-display-md">
            Every role gets the console it actually needs.
          </h2>
        </div>

        <div appScrollReveal [revealDelay]="80" class="mt-10 flex flex-wrap gap-2">
          @for (role of roles; track role.id) {
            <button
              type="button"
              class="rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors"
              [class.border-teal-400]="activeId() === role.id"
              [class.text-teal-300]="activeId() === role.id"
              [class.bg-navy-900]="activeId() === role.id"
              [class.border-navy-700]="activeId() !== role.id"
              [class.text-gray-500]="activeId() !== role.id"
              (click)="activeId.set(role.id)"
            >
              {{ role.label }}
            </button>
          }
        </div>

        @if (active(); as role) {
          <div appScrollReveal class="mkt-panel mt-6 grid grid-cols-1 gap-10 p-8 sm:p-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h3 class="font-display text-2xl font-semibold text-white">{{ role.headline }}</h3>
              <p class="mt-4 text-base leading-relaxed text-gray-400">{{ role.description }}</p>
            </div>
            <ul class="space-y-3">
              @for (point of role.points; track point) {
                <li class="flex items-start gap-3 text-sm text-gray-300">
                  <span class="mt-0.5 text-teal-400">✓</span>
                  <span>{{ point }}</span>
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </section>
  `,
})
export class RoleTabsComponent {
  roles: RoleTab[] = [
    {
      id: 'doctors',
      label: 'Doctors',
      headline: 'Walk into every visit already briefed.',
      description:
        'The chart is structured before the patient sits down — history, vitals, and intake notes are already there, not buried in a PDF from three systems ago.',
      points: [
        'AI-drafted intake and symptom summary waiting in the EMR',
        'Drug interaction checks run automatically on every prescription',
        'Sign and blockchain-anchor a record in one action',
      ],
    },
    {
      id: 'reception',
      label: 'Front desk',
      headline: 'Fill every slot without playing phone tag.',
      description:
        'Walk-ins get a queue token in seconds, phone bookings happen even when the desk is unattended, and the schedule stays accurate on its own.',
      points: [
        'Live queue with real-time wait estimates',
        'AI handles after-hours calls without a voicemail black hole',
        'One screen for booking, rescheduling, and check-in',
      ],
    },
    {
      id: 'nurses',
      label: 'Nurses',
      headline: 'Update status without hunting for the chart.',
      description:
        'Vitals, patient status, and queue movement update from wherever you are, so the doctor and the front desk see the same picture you do.',
      points: [
        'Fast vitals entry tied straight to the medical record',
        'Queue and patient status visible across the floor',
        'Assist-doctor workflows without re-entering data',
      ],
    },
    {
      id: 'admins',
      label: 'Administrators',
      headline: 'See the whole operation, not just today.',
      description:
        'Revenue, staffing, and call outcomes roll up into one dashboard — so decisions are based on trends, not a gut feeling at the end of the month.',
      points: [
        'Live revenue, appointment, and call analytics',
        'Staff and branch management from a single console',
        'Audit logs for every sensitive action, automatically kept',
      ],
    },
    {
      id: 'patients',
      label: 'Patients',
      headline: 'Never wait on hold to see your own record.',
      description:
        'Book, reschedule, and pay without calling anyone — and see exactly what your doctor sees, whenever you want.',
      points: [
        'Book an appointment by phone, voice, or online — any time',
        'View records, prescriptions, and invoices in one place',
        'Get a text or call reminder before every visit',
      ],
    },
  ];

  activeId = signal(this.roles[0].id);
  active = () => this.roles.find((r) => r.id === this.activeId());
}
