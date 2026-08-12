import { Component } from '@angular/core';
import { MarketingNavComponent } from '../../components/marketing-nav/marketing-nav.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { MetricStripComponent } from '../../components/metric-strip/metric-strip.component';
import { CapabilityGridComponent } from '../../components/capability-grid/capability-grid.component';
import { HowItWorksComponent } from '../../components/how-it-works/how-it-works.component';
import { RoleTabsComponent } from '../../components/role-tabs/role-tabs.component';
import { SecurityBandComponent } from '../../components/security-band/security-band.component';
import { TestimonialsComponent } from '../../components/testimonials/testimonials.component';
import { PricingComponent } from '../../components/pricing/pricing.component';
import { FaqComponent } from '../../components/faq/faq.component';
import { FinalCtaComponent } from '../../components/final-cta/final-cta.component';
import { MarketingFooterComponent } from '../../components/marketing-footer/marketing-footer.component';

@Component({
  selector: 'app-landing',
  imports: [
    MarketingNavComponent,
    HeroComponent,
    MetricStripComponent,
    CapabilityGridComponent,
    HowItWorksComponent,
    RoleTabsComponent,
    SecurityBandComponent,
    TestimonialsComponent,
    PricingComponent,
    FaqComponent,
    FinalCtaComponent,
    MarketingFooterComponent,
  ],
  template: `
    <div class="bg-navy-950">
      <app-marketing-nav />
      <main>
        <app-hero />
        <app-metric-strip />
        <app-capability-grid />
        <app-how-it-works />
        <app-role-tabs />
        <app-security-band />
        <app-testimonials />
        <app-pricing />
        <app-faq />
        <app-final-cta />
      </main>
      <app-marketing-footer />
    </div>
  `,
})
export class LandingComponent {}
