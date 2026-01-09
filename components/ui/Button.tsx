'use client';

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { BUTTON_STYLES, cn } from '@/domain/types/design-tokens';
import { Loader2 } from 'lucide-react';

/**
 * Button Variants
 * Defines visual styles for different button purposes
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Button Sizes
 * Defines size variations for buttons
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Button Props
 * Extends native button attributes with custom props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Whether the button is in a loading state
   * Shows spinner and disables interaction
   * @default false
   */
  loading?: boolean;

  /**
   * Button content (text, icons, etc.)
   */
  children: ReactNode;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Unified Button Component
 *
 * A reusable button component that follows SOLID principles and uses design tokens.
 * Replaces 191 instances of inline button styles across the application.
 *
 * Features:
 * - Four variants: primary, secondary, danger, ghost
 * - Four sizes: xs, sm, md, lg
 * - Loading state with spinner
 * - Disabled state handling
 * - Full dark mode support via design tokens
 * - Type-safe props extending HTMLButtonElement
 * - Forwards ref for advanced use cases
 *
 * Architecture:
 * - Single Responsibility: Only renders buttons
 * - Open/Closed: Easy to extend via className prop
 * - Dependency Inversion: Depends on design tokens abstraction
 *
 * @example
 * ```tsx
 * // Primary button (default)
 * <Button onClick={handleSubmit}>
 *   Submit
 * </Button>
 *
 * // Secondary button with custom size
 * <Button variant="secondary" size="sm">
 *   Cancel
 * </Button>
 *
 * // Loading state
 * <Button loading disabled>
 *   Saving...
 * </Button>
 *
 * // Danger button
 * <Button variant="danger" onClick={handleDelete}>
 *   Delete Account
 * </Button>
 *
 * // Ghost button (minimal style)
 * <Button variant="ghost" size="xs">
 *   Learn more
 * </Button>
 * ```
 *
 * GDPR/Accessibility:
 * - Disabled state prevents accidental actions
 * - Loading state provides visual feedback
 * - All native button attributes supported (aria-*, role, etc.)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Compute disabled state (disabled if loading OR explicitly disabled)
    const isDisabled = disabled || loading;

    // Combine styles using design tokens
    const buttonClasses = cn(
      // Base styles
      BUTTON_STYLES.base,

      // Size styles
      BUTTON_STYLES.size[size],

      // Variant styles
      BUTTON_STYLES.variant[variant],

      // Disabled state
      isDisabled && 'opacity-50 cursor-not-allowed select-none',

      // Loading state (prevent hover effects)
      loading && 'pointer-events-none',

      // Custom classes
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={buttonClasses}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <Loader2
            className="animate-spin mr-2"
            size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
            aria-hidden="true"
          />
        )}

        {/* Button content */}
        {children}
      </button>
    );
  }
);

// Display name for React DevTools
Button.displayName = 'Button';

/**
 * Button Component Exports
 *
 * Usage:
 * ```tsx
 * import { Button } from '@/components/ui/Button';
 * import type { ButtonProps, ButtonVariant, ButtonSize } from '@/components/ui/Button';
 * ```
 */
export default Button;
