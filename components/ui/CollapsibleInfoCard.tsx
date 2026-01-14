/**
 * CollapsibleInfoCard Component
 *
 * Expandable/collapsible info card for displaying helpful information.
 * Saves vertical space while keeping info accessible on demand.
 *
 * Architecture:
 * - Uses design tokens for styling
 * - Framer Motion for smooth animations
 * - Lucide icons for visual hierarchy
 *
 * Features:
 * - Click to expand/collapse
 * - Animated chevron icon
 * - Smooth height transition
 * - Semantic color variants (blue, green, yellow, red)
 * - Full dark mode support
 *
 * Usage:
 * ```tsx
 * <CollapsibleInfoCard
 *   title="About Sender Email"
 *   variant="blue"
 *   icon={Info}
 *   defaultOpen={false}
 * >
 *   <ul>
 *     <li>Your sender email appears in the "From" field</li>
 *     <li>You can only use verified domains</li>
 *   </ul>
 * </CollapsibleInfoCard>
 * ```
 */

'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { CARD_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';

/**
 * Color variant for the card
 */
export type InfoCardVariant = 'blue' | 'green' | 'yellow' | 'red';

/**
 * Props for CollapsibleInfoCard
 */
export interface CollapsibleInfoCardProps {
  /**
   * Card title (always visible)
   */
  title: string;

  /**
   * Card content (shown when expanded)
   */
  children: ReactNode;

  /**
   * Color variant
   * @default 'blue'
   */
  variant?: InfoCardVariant;

  /**
   * Icon to display next to title
   */
  icon?: LucideIcon;

  /**
   * Whether the card starts expanded
   * @default false
   */
  defaultOpen?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(variant: InfoCardVariant) {
  const styles = {
    blue: {
      background: 'bg-blue-50/90 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      content: 'text-blue-800 dark:text-blue-200',
    },
    green: {
      background: 'bg-green-50/90 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
      content: 'text-green-800 dark:text-green-200',
    },
    yellow: {
      background: 'bg-yellow-50/90 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
      content: 'text-yellow-800 dark:text-yellow-200',
    },
    red: {
      background: 'bg-red-50/90 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
      content: 'text-red-800 dark:text-red-200',
    },
  };

  return styles[variant];
}

/**
 * CollapsibleInfoCard
 *
 * Expandable card for displaying contextual information.
 * Helps reduce vertical space usage in settings pages.
 */
export function CollapsibleInfoCard({
  title,
  children,
  variant = 'blue',
  icon: Icon,
  defaultOpen = false,
  className,
}: CollapsibleInfoCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = getVariantStyles(variant);

  return (
    <div
      className={cn(
        CARD_STYLES.base,
        CARD_STYLES.background.default,
        CARD_STYLES.border.default,
        styles.background,
        styles.border,
        'overflow-hidden',
        className
      )}
    >
      {/* Header (always visible, clickable) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          CARD_STYLES.padding.md,
          'w-full flex items-center gap-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5'
        )}
        aria-expanded={isOpen}
      >
        {/* Icon */}
        {Icon && <Icon className={cn('w-5 h-5 flex-shrink-0', styles.icon)} />}

        {/* Title */}
        <h3 className={cn(TEXT_STYLES.heading.h3, styles.title, 'flex-1')}>
          {title}
        </h3>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={cn('w-4 h-4', styles.icon)} />
        </motion.div>
      </button>

      {/* Content (collapsible) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div
              className={cn(
                'px-6 pb-6',
                TEXT_STYLES.body.base,
                styles.content
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CollapsibleInfoCard;
