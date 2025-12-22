"use client";

import { useLocale, useSetLocale } from '@/lib/i18n/context';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: 'en' | 'es') => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all text-sm font-medium text-foreground/80 hover:text-foreground"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl border border-border shadow-xl overflow-hidden min-w-[140px]">
            <button
              onClick={() => switchLocale('en')}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                locale === 'en'
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground/60 hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              English
            </button>
            <button
              onClick={() => switchLocale('es')}
              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                locale === 'es'
                  ? 'bg-accent/10 text-accent'
                  : 'text-foreground/60 hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              Español
            </button>
          </div>
        </>
      )}
    </div>
  );
}
