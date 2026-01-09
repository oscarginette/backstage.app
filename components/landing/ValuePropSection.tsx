"use client";

import { Mail, Users, TrendingUp } from "lucide-react";
import { useTranslations } from '@/lib/i18n/context';
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from '@/components/ui/Card';

export default function ValuePropSection() {
  const t = useTranslations('valueProp');
  const [index, setIndex] = useState(0);
  const words = [
    t('flywheel.words.moreGigs'),
    t('flywheel.words.moreFans'),
    t('flywheel.words.moreReach')
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <section className="py-24 border-y border-border overflow-hidden bg-background transition-colors duration-500">
      <div className="container px-4 mx-auto">

        {/* Flywheel Animation Section */}
        <div className="text-center mb-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />

          <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground leading-tight whitespace-nowrap">
            {t('flywheel.title')} <span className="text-accent italic">{t('flywheel.titleAccent')}</span>
          </h2>

          <div className="h-20 md:h-32 flex items-center justify-center overflow-hidden mt-2">
            <span className="text-3xl md:text-6xl text-muted-foreground font-serif mr-4">=</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-4xl md:text-7xl font-bold text-foreground"
              >
                {words[index]}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-8 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('flywheel.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Reach */}
          <Card variant="default" padding="lg" className="hover:shadow-lg transition-all duration-300 hover:border-accent/20">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent mb-6 transition-colors">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">{t('directReach.title')}</h3>
            <p className="text-muted-foreground leading-relaxed font-sans">
              {t('directReach.description')}
            </p>
          </Card>

          {/* Card 2: Ownership */}
          <Card variant="default" padding="lg" className="hover:shadow-lg transition-all duration-300 hover:border-accent/20">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent mb-6 transition-colors">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">{t('totalOwnership.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('totalOwnership.description')}
            </p>
          </Card>

          {/* Card 3: Conversion */}
          <Card variant="default" padding="lg" className="hover:shadow-lg transition-all duration-300 hover:border-accent/20">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent mb-6 transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">{t('trueCommunity.title')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('trueCommunity.description')}
            </p>
          </Card>
        </div>

        {/* Comparison Graphic - Inverted for dark mode showcase */}
        <Card variant="default" padding="lg" className="mt-16 overflow-hidden relative shadow-2xl bg-gradient-to-br from-card to-muted/20 dark:from-card dark:to-card/50 border-border/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 dark:bg-accent/20 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 dark:bg-accent/10 rounded-full blur-[100px] -z-10" />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h4 className="text-3xl md:text-4xl font-serif mb-6 text-foreground">{t('engagement.title')}</h4>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                {t('engagement.description')}
              </p>
            </div>

            <div className="flex justify-center items-end gap-12 h-64">
              {/* Social Reach Bar */}
              <div className="flex flex-col items-center gap-6 w-48 group">
                <div className="w-full bg-muted/50 dark:bg-muted border border-border h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:h-16 group-hover:bg-muted dark:group-hover:bg-muted/80">
                  <span className="text-lg font-bold text-muted-foreground">3-5%</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
                  {t('engagement.socialReach')}
                </span>
              </div>

              {/* Email Open Rate Bar */}
              <div className="flex flex-col items-center gap-6 w-48 group">
                <div className="w-full bg-accent h-48 rounded-2xl flex items-center justify-center shadow-[0_24px_48px_-12px_rgba(255,85,0,0.4)] dark:shadow-[0_24px_48px_-12px_rgba(255,107,44,0.5)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2">
                  <span className="text-3xl font-black text-white">35%</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent text-center">
                  {t('engagement.emailOpenRate')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
