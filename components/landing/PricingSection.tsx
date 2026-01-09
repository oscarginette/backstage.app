"use client";

import { Check, X, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from '@/lib/i18n/context';
import { PATHS } from '@/lib/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from "framer-motion";

export default function PricingSection() {
  const t = useTranslations('pricing');
  const [isAnnual, setIsAnnual] = useState(true);

  // Manual Validation Strategy:
  // - 4 Tiers
  // - Unlimited Gates for everyone
  // - Focus on Contacts/Emails limits
  // - Manual payment upgrade flow (Simulated via Free Signup)

  // Prices (optimized for better savings narrative)
  const prices = {
    free: 0,
    pro: 9.99,
    business: 19.99,  // Reduced from 29.99
    unlimited: 39.99  // Reduced from 49.99
  };

  const calculatePrice = (basePrice: number) => {
    if (basePrice === 0) return "€0";
    if (isAnnual) {
      // 20% discount applied
      const discounted = basePrice * 0.8;
      return `€${discounted.toFixed(2)}`; 
    }
    return `€${basePrice}`;
  };

  const plans = [
    {
      id: "free",
      nameKey: "free.name",
      descriptionKey: "free.description",
      price: calculatePrice(prices.free),
      basePrice: prices.free,
      periodKey: "free.period",
      ctaKey: "free.cta",
      highlight: true,
      features: [
        { nameKey: "free.features.contacts", included: true },
        { nameKey: "free.features.emails", included: true },
        { nameKey: "free.features.smartGates", included: true, highlight: true },
        { nameKey: "free.features.basicAnalytics", included: true },
        { nameKey: "free.features.prioritySupport", included: false },
      ],
    },
    {
      id: "pro",
      nameKey: "pro.name",
      descriptionKey: "pro.description",
      price: calculatePrice(prices.pro),
      basePrice: prices.pro,
      periodKey: "pro.period",
      ctaKey: "pro.cta",
      highlight: false,
      features: [
        { nameKey: "pro.features.contacts", included: true },
        { nameKey: "pro.features.emails", included: true },
        { nameKey: "pro.features.smartGates", included: true, highlight: true },
        { nameKey: "pro.features.advancedInsights", included: true },
        { nameKey: "pro.features.prioritySupport", included: true },
      ],
    },
    {
      id: "business",
      nameKey: "business.name",
      descriptionKey: "business.description",
      price: calculatePrice(prices.business),
      basePrice: prices.business,
      periodKey: "business.period",
      ctaKey: "business.cta",
      highlight: false,
      bigLeagues: true,
      features: [
        { nameKey: "business.features.contacts", included: true },
        { nameKey: "business.features.emails", included: true },
        { nameKey: "business.features.smartGates", included: true, highlight: true },
        { nameKey: "business.features.advancedInsights", included: true },
        { nameKey: "business.features.prioritySupport", included: true },
      ],
    },
    {
      id: "unlimited",
      nameKey: "unlimited.name",
      descriptionKey: "unlimited.description",
      price: calculatePrice(prices.unlimited),
      basePrice: prices.unlimited,
      periodKey: "unlimited.period",
      ctaKey: "unlimited.cta",
      highlight: false,
      bigLeagues: true,
      features: [
        { nameKey: "unlimited.features.contacts", included: true },
        { nameKey: "unlimited.features.emails", included: true },
        { nameKey: "unlimited.features.smartGates", included: true, highlight: true },
        { nameKey: "unlimited.features.advancedInsights", included: true },
        { nameKey: "unlimited.features.dedicatedManager", included: true },
      ],
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/40 dark:bg-background transition-colors duration-500">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 text-foreground">
            {t('title.line1')} <br />
            <span className="italic text-accent">{t('title.line2')}</span> {t('title.line3')}
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            {t('allInclude')} <strong>{t('unlimitedGates')}</strong>.
            {t('payAsGrow')}
          </p>

          {/* Toggle with logic */}
          <div className="inline-flex items-center p-1 bg-card rounded-full border border-border shadow-sm">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className="relative px-6 py-2 text-sm font-black transition-all active:scale-95 group"
            >
              <span className={`relative z-10 transition-colors duration-300 ${!isAnnual ? 'text-background' : 'text-foreground/40 group-hover:text-foreground'}`}>
                {t('monthly')}
              </span>
              {!isAnnual && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-foreground rounded-full shadow-lg shadow-black/5"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className="relative px-8 py-2 text-sm font-black transition-all active:scale-95 group"
            >
              <div className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${isAnnual ? 'text-background' : 'text-foreground/40 group-hover:text-foreground'}`}>
                <span>{t('annual')}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${isAnnual ? 'bg-background/20 text-background' : 'bg-accent/10 text-accent ring-1 ring-accent/20'}`}>
                  {t('save')}
                </span>
              </div>
              {isAnnual && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-foreground rounded-full shadow-lg shadow-black/5"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              variant={plan.highlight ? "highlighted" : "default"}
              padding="md"
              className={`relative flex flex-col transition-all duration-300 hover:shadow-lg ${
                plan.highlight
                  ? "scale-[1.02] md:scale-105 z-10 shadow-xl"
                  : ""
              }`}
            >
              {plan.bigLeagues && (
                  <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-800 rounded-full text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide w-fit">
                    <Trophy className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    {t('bigLeagues')}
                  </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-serif mb-2 text-foreground">{t(plan.nameKey)}</h3>
                <p className="text-muted-foreground text-xs min-h-[40px]">{t(plan.descriptionKey)}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm font-medium">{t(plan.periodKey)}</span>
                </div>
                {isAnnual && plan.basePrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    €{(plan.basePrice * 0.8 * 12).toFixed(2)}{t('perYear')}
                  </p>
                )}
              </div>

              <div className="flex-grow space-y-4 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('includes')}</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <Check className={`w-4 h-4 flex-shrink-0 ${feature.highlight ? "text-accent" : "text-foreground"}`} />
                      ) : (
                        <X className="w-4 h-4 flex-shrink-0 text-muted-foreground/30" />
                      )}
                      <span className={`${feature.included ? "text-foreground/80" : "text-muted-foreground/40"} ${feature.highlight ? "font-semibold text-foreground" : ""}`}>
                        {t(feature.nameKey)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href={PATHS.LOGIN} className="w-full">
                <Button
                  variant="primary"
                  size="md"
                  className={`w-full rounded-xl ${
                    plan.highlight
                      ? "shadow-xl"
                      : ""
                  }`}
                >
                  {t(plan.ctaKey)}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
            <p className="text-muted-foreground text-sm">
              {t('enterprise.text')} <a href="mailto:contact@backstage.app" className="underline hover:text-foreground transition-colors">{t('enterprise.link')}</a> {t('enterprise.for')}
            </p>
        </div>
      </div>
    </section>
  );
}
