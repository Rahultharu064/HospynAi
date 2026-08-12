import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Fades + slides an element into view the first time it crosses the viewport.
 * Usage: <div appScrollReveal [revealDelay]="80">…</div>
 */
@Directive({
  selector: '[appScrollReveal]',
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  /** Stagger delay in milliseconds, useful for revealing a row of siblings in sequence. */
  @Input() revealDelay = 0;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-revealed');
      return;
    }

    node.style.transitionDelay = `${this.revealDelay}ms`;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-revealed');
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
