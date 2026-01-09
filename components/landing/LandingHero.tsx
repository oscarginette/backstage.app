"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';
import { PATHS } from '@/lib/paths';
import { Button } from '@/components/ui/Button';

export default function LandingHero() {
  const t = useTranslations('hero');

  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24 bg-background transition-colors duration-500">
      {/* Background Aurora Effect - Adaptive for dark mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
        <div className="bg-aurora-light dark:bg-aurora-dark w-full h-full opacity-30 dark:opacity-40 transition-opacity duration-500" />
      </div>

      <div className="container px-4 mx-auto text-center">
        <div className="inline-flex items-center gap-2 pl-2.5 pr-4 py-1.5 mb-8 text-sm font-medium border rounded-full bg-card/50 border-border backdrop-blur-sm">
          <span className="flex w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-foreground/80">{t('launchBadge')}</span>
        </div>

        <h1 className="max-w-5xl mx-auto mb-6 text-6xl md:text-8xl font-serif tracking-tight leading-[0.9] text-foreground">
          {t('title.main')} <br />
          <span className="text-accent italic">{t('title.accent')}</span>
        </h1>

        <p className="max-w-2xl mx-auto mb-10 text-xl md:text-2xl text-muted-foreground leading-relaxed font-sans">
          {t('newSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={PATHS.LOGIN} className="group">
            <Button variant="primary" size="lg" className="rounded-full h-14 px-8 text-lg gap-2">
              {t('startFree')}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground font-medium italic">
            {t('noCardRequired')}
          </p>
        </div>
      </div>
    </section>
  );
}
