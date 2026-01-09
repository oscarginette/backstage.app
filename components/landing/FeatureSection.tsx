"use client";

import { CheckCircle2, Zap, Palette, BarChart3 } from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';
import { Card } from '@/components/ui/Card';

export default function FeatureSection() {
  const t = useTranslations('features');

  const features = [
    {
      titleKey: "smartGate.title",
      descriptionKey: "smartGate.description",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      titleKey: "autoNewsletter.title",
      descriptionKey: "autoNewsletter.description",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      titleKey: "analytics.title",
      descriptionKey: "analytics.description",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      titleKey: "zeroEffort.title",
      descriptionKey: "zeroEffort.description",
      icon: <CheckCircle2 className="w-5 h-5" />,
    }
  ];

  return (
    <section className="py-24 bg-background transition-colors duration-500">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3 sticky top-24">
            <h2 className="text-5xl font-serif mb-6 leading-tight text-foreground">
              {t('title.line1')} <br />
              <span className="italic text-accent underline decoration-accent/20">{t('title.line2')}</span> {t('title.line3')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t('subtitle')}
            </p>
          </div>

          <div className="md:w-2/3 grid sm:grid-cols-2 gap-x-12 gap-y-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="subtle"
                padding="md"
                className="flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:border-accent/20"
              >
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-accent bg-accent/10 dark:bg-accent/5 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-serif leading-none text-foreground">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
