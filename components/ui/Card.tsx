'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { CARD_STYLES, TEXT_STYLES, cn } from '@/domain/types/design-tokens';

/**
 * Card Component System
 *
 * Unified card component following Clean Architecture + SOLID principles.
 * Provides consistent styling across the application with dark mode support.
 *
 * Architecture:
 * - Single Responsibility: Each sub-component handles one UI concern
 * - Open/Closed: Extendable via variants and className overrides
 * - Dependency Inversion: Depends on design-tokens abstraction
 *
 * Features:
 * - Auto dark mode support via CSS variables
 * - Three variants: default, subtle, highlighted
 * - Three padding sizes: sm, md, lg
 * - Composable sub-components
 *
 * Usage:
 * ```tsx
 * import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
 *
 * <Card variant="default" padding="md">
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description text</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Main content goes here
 *   </CardContent>
 *   <CardFooter>
 *     Footer content
 *   </CardFooter>
 * </Card>
 * ```
 *
 * @see domain/types/design-tokens.ts for style definitions
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Card variant types
 * - default: Standard card with normal background opacity
 * - subtle: Lower opacity background for layered designs
 * - highlighted: Strong border for emphasis
 */
export type CardVariant = 'default' | 'subtle' | 'highlighted';

/**
 * Card padding size types
 * - compact: 12px (p-3) - For no-scroll layouts
 * - sm: 16px (p-4)
 * - md: 24px (p-6)
 * - lg: 32px (p-8)
 */
export type CardPadding = 'compact' | 'sm' | 'md' | 'lg';

/**
 * Props for the main Card component
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the card
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Padding size for the card
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Children elements
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for CardHeader component
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Children elements (typically CardTitle and CardDescription)
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for CardTitle component
 */
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /**
   * Title text or elements
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for CardDescription component
 */
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  /**
   * Description text or elements
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for CardContent component
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Main content elements
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for CardFooter component
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Footer content (typically actions or metadata)
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

// =============================================================================
// Helper Functions (SRP: Style composition)
// =============================================================================

/**
 * Gets the background style for a card variant
 * @param variant - The card variant
 * @returns Tailwind CSS classes for background
 */
function getBackgroundStyle(variant: CardVariant): string {
  switch (variant) {
    case 'subtle':
      return CARD_STYLES.background.subtle;
    case 'highlighted':
      return CARD_STYLES.background.default;
    case 'default':
    default:
      return CARD_STYLES.background.default;
  }
}

/**
 * Gets the border style for a card variant
 * @param variant - The card variant
 * @returns Tailwind CSS classes for border
 */
function getBorderStyle(variant: CardVariant): string {
  switch (variant) {
    case 'subtle':
      return CARD_STYLES.border.subtle;
    case 'highlighted':
      return CARD_STYLES.border.strong;
    case 'default':
    default:
      return CARD_STYLES.border.default;
  }
}

/**
 * Gets the padding style for a card
 * @param padding - The padding size
 * @returns Tailwind CSS classes for padding
 */
function getPaddingStyle(padding: CardPadding): string {
  return CARD_STYLES.padding[padding];
}

// =============================================================================
// Main Card Component
// =============================================================================

/**
 * Card
 *
 * Main container component with variants and padding options.
 * Automatically applies dark mode styles via design tokens.
 *
 * @example
 * ```tsx
 * <Card variant="default" padding="md">
 *   Content goes here
 * </Card>
 * ```
 */
export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        CARD_STYLES.base,
        getBackgroundStyle(variant),
        getBorderStyle(variant),
        getPaddingStyle(padding),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * CardHeader
 *
 * Container for card title and description.
 * Provides consistent spacing and layout.
 *
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>My Title</CardTitle>
 *   <CardDescription>Optional description</CardDescription>
 * </CardHeader>
 * ```
 */
export function CardHeader({
  children,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn('space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle
 *
 * Title text for the card header.
 * Uses serif font and appropriate sizing.
 *
 * @example
 * ```tsx
 * <CardTitle>Integration Settings</CardTitle>
 * ```
 */
export function CardTitle({
  children,
  className,
  ...props
}: CardTitleProps) {
  return (
    <h3
      className={cn(
        TEXT_STYLES.heading.h2,
        'text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription
 *
 * Subtitle or description text for the card.
 * Uses muted color for visual hierarchy.
 *
 * @example
 * ```tsx
 * <CardDescription>
 *   Configure your integration settings below
 * </CardDescription>
 * ```
 */
export function CardDescription({
  children,
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn(
        TEXT_STYLES.body.subtle,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * CardContent
 *
 * Main content area of the card.
 * Adds top padding to separate from header.
 *
 * @example
 * ```tsx
 * <CardContent>
 *   <p>Main content goes here</p>
 * </CardContent>
 * ```
 */
export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div
      className={cn('pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * CardFooter
 *
 * Footer area for actions or metadata.
 * Adds top padding and flex layout for actions.
 *
 * @example
 * ```tsx
 * <CardFooter>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </CardFooter>
 * ```
 */
export function CardFooter({
  children,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn('pt-4 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default Card;
