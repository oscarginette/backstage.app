import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * StatCard Component
 *
 * Displays a statistic with icon, label, and value.
 * Uses design tokens for dark mode support and consistent styling.
 *
 * Features:
 * - Adaptive colors (light/dark mode via CSS variables)
 * - Four color schemes: blue, orange, purple, green
 * - Hover effects with transforms and shadows
 * - Backdrop blur and gradient effects
 */

export type StatCardColorScheme = 'blue' | 'orange' | 'purple' | 'green';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorScheme: StatCardColorScheme;
}

const COLOR_SCHEMES: Record<
  StatCardColorScheme,
  {
    iconColor: string;
    iconBg: string;
    borderColor: string;
    gradientBg: string;
  }
> = {
  blue: {
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-500/10 dark:bg-blue-400/10',
    borderColor: 'border-blue-100/50 dark:border-blue-900/30',
    gradientBg: 'bg-blue-500/10 dark:bg-blue-400/10',
  },
  orange: {
    iconColor: 'text-primary dark:text-primary',
    iconBg: 'bg-primary/10 dark:bg-primary/10',
    borderColor: 'border-primary/10 dark:border-primary/20',
    gradientBg: 'bg-primary/10 dark:bg-primary/10',
  },
  purple: {
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/10 dark:bg-purple-400/10',
    borderColor: 'border-purple-100/50 dark:border-purple-900/30',
    gradientBg: 'bg-purple-500/10 dark:bg-purple-400/10',
  },
  green: {
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    borderColor: 'border-emerald-100/50 dark:border-emerald-900/30',
    gradientBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
  },
};

export default function StatCard({ label, value, icon: Icon, colorScheme }: StatCardProps) {
  const colors = COLOR_SCHEMES[colorScheme];

  return (
    <div
      className={`
        relative overflow-hidden flex items-center justify-between p-4
        bg-card/60 backdrop-blur-xl border ${colors.borderColor}
        rounded-2xl transition-all duration-500
        hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5
        hover:-translate-y-0.5 group
      `}
    >
      {/* Decorative Gradient Backdrop */}
      <div
        className={`
          absolute -right-2 -top-2 w-16 h-16 rounded-full blur-2xl
          opacity-0 group-hover:opacity-20 transition-opacity duration-1000
          ${colors.gradientBg}
        `}
      />

      {/* Icon and Title */}
      <div className="flex items-center gap-2.5">
        <div
          className={`
            w-9 h-9 flex shrink-0 items-center justify-center ${colors.iconBg}
            rounded-xl transition-all duration-500
            group-hover:scale-110 group-hover:rotate-3 shadow-sm
          `}
        >
          <Icon className={`w-4.5 h-4.5 ${colors.iconColor}`} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold leading-tight">
          {label}
        </p>
      </div>

      {/* Value */}
      <h3 className="text-2xl font-serif text-foreground tracking-tight tabular-nums">
        {value}
      </h3>
    </div>
  );
}
