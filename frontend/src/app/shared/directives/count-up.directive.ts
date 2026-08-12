import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a numeral counting up from 0 to [countTo] once it scrolls into view.
 * Usage: <span appCountUp [countTo]="70" countSuffix="%">0%</span>
 */
@Directive({
  selector: '[appCountUp]',
})
export class CountUpDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private frame?: number;

  @Input({ required: true, alias: 'appCountUp' }) countTo!: number;
  @Input() countSuffix = '';
  @Input() countPrefix = '';
  @Input() countDurationMs = 1400;
  @Input() countDecimals = 0;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.textContent = `${this.countPrefix}${this.countTo}${this.countSuffix}`;
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.animate();
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.4 }
    );
    this.observer.observe(node);
  }

  private animate(): void {
    const node = this.el.nativeElement;
    const start = performance.now();
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const step = (now: number) => {
      const progress = Math.min((now - start) / this.countDurationMs, 1);
      const value = this.countTo * easeOutQuint(progress);
      node.textContent = `${this.countPrefix}${value.toFixed(this.countDecimals)}${this.countSuffix}`;
      if (progress < 1) {
        this.frame = requestAnimationFrame(step);
      }
    };
    this.frame = requestAnimationFrame(step);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.frame) cancelAnimationFrame(this.frame);
  }
}
