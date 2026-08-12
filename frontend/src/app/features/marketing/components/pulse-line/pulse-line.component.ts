import { Component, Input } from '@angular/core';

/**
 * The page's signature motif: a continuous ECG trace that threads through the hero,
 * the "how it works" spine, and the closing CTA — a literal rendering of "always-on."
 */
@Component({
  selector: 'app-pulse-line',
  template: `
    <svg
      class="pulse-line"
      [class.pulse-line--vertical]="orientation === 'vertical'"
      [attr.viewBox]="orientation === 'vertical' ? '0 0 120 1200' : '0 0 1200 120'"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path [attr.d]="path" class="pulse-line__base" pathLength="1000" />
      <path [attr.d]="path" class="pulse-line__beam" pathLength="1000" />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        line-height: 0;
      }

      .pulse-line {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .pulse-line--vertical {
        width: 100%;
        height: 100%;
      }

      .pulse-line__base {
        fill: none;
        stroke: var(--pulse-base-color, rgba(45, 212, 191, 0.14));
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .pulse-line__beam {
        fill: none;
        stroke: var(--pulse-beam-color, #2dd4bf);
        stroke-width: 2.25;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-dasharray: 90 910;
        filter: drop-shadow(0 0 6px rgba(45, 212, 191, 0.85));
        animation: pulse-travel 5.5s linear infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .pulse-line__beam {
          animation: none;
          stroke-dasharray: 1000 0;
          opacity: 0.5;
          filter: none;
        }
      }

      @keyframes pulse-travel {
        from {
          stroke-dashoffset: 1000;
        }
        to {
          stroke-dashoffset: -1000;
        }
      }
    `,
  ],
})
export class PulseLineComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  private readonly horizontalPath =
    'M0,60 L120,60 L145,35 L165,85 L185,15 L205,60 L340,60 ' +
    'L365,60 L390,35 L410,85 L430,15 L450,60 L585,60 ' +
    'L610,60 L635,35 L655,85 L675,15 L695,60 L830,60 ' +
    'L855,60 L880,35 L900,85 L920,15 L940,60 L1200,60';

  private readonly verticalPath =
    'M60,0 L60,120 L35,145 L85,165 L15,185 L60,205 L60,340 ' +
    'L60,365 L35,390 L85,410 L15,430 L60,450 L60,585 ' +
    'L60,610 L35,635 L85,655 L15,675 L60,695 L60,830 ' +
    'L60,855 L35,880 L85,900 L15,920 L60,940 L60,1200';

  get path(): string {
    return this.orientation === 'vertical' ? this.verticalPath : this.horizontalPath;
  }
}
