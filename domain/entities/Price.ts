import type {
  RecurringInterval,
  BillingPeriod,
  PriceType,
  PriceMetadata,
} from '../types/stripe';
import { intervalToBillingPeriod } from '../types/stripe';

/**
 * Price Entity (Stripe-compatible)
 *
 * Represents a pricing option for a Product (e.g., "Pro Monthly", "Pro Yearly").
 * A Product can have multiple Prices with different billing intervals.
 *
 * Mirrors: https://docs.stripe.com/api/prices/object
 */
export class Price {
  constructor(
    public readonly id: string,  // Format: price_ProMonthly, price_ProYearly
    public readonly object: string,  // Always 'price'
    public readonly productId: string,  // Format: prod_Pro
    public readonly active: boolean,
    public readonly currency: string,  // 'eur'
    public readonly unitAmount: number,  // Price in CENTS (999 = €9.99)
    public readonly unitAmountDecimal: string | null,
    public readonly type: PriceType,  // 'one_time' | 'recurring'
    public readonly billingScheme: string,  // 'per_unit' | 'tiered'
    public readonly recurringInterval: RecurringInterval | null,  // 'month' | 'year'
    public readonly recurringIntervalCount: number,  // Usually 1
    public readonly recurringUsageType: string | null,  // 'licensed' | 'metered'
    public readonly metadata: PriceMetadata,
    public readonly created: Date,
    public readonly updated: Date,
    public readonly livemode: boolean
  ) {
    this.validate();
    Object.freeze(this);  // Immutable
  }

  // ============================================================
  // Validation
  // ============================================================

  private validate(): void {
    if (!this.id || !this.id.startsWith('price_')) {
      throw new Error('Price ID must start with "price_"');
    }

    if (!this.productId || !this.productId.startsWith('prod_')) {
      throw new Error('Product ID must start with "prod_"');
    }

    if (this.unitAmount < 0) {
      throw new Error('Unit amount cannot be negative');
    }

    if (this.object !== 'price') {
      throw new Error('Object must be "price"');
    }

    if (this.type === 'recurring' && !this.recurringInterval) {
      throw new Error('Recurring prices must have a recurring interval');
    }
  }

  // ============================================================
  // Getters
  // ============================================================

  /**
   * Get price in euros (from cents)
   * Example: 999 → 9.99
   */
  getPriceInEur(): number {
    return this.unitAmount / 100;
  }

  /**
   * Get formatted price with currency
   * Example: "€9.99"
   */
  getFormattedPrice(): string {
    const price = this.getPriceInEur();
    return `€${price.toFixed(2)}`;
  }

  /**
   * Get billing period (monthly or yearly)
   */
  getBillingPeriod(): BillingPeriod | null {
    if (!this.recurringInterval) return null;
    return intervalToBillingPeriod(this.recurringInterval);
  }

  /**
   * Get formatted price with billing period
   * Example: "€9.99/month" or "€95.90/year"
   */
  getFormattedPriceWithPeriod(): string {
    const price = this.getFormattedPrice();
    const period = this.getBillingPeriod();

    if (!period) return price;

    return period === 'yearly' ? `${price}/year` : `${price}/month`;
  }

  /**
   * Get discount percentage (from metadata)
   */
  getDiscountPercentage(): number {
    if (!this.metadata.discount_percentage) return 0;
    return parseInt(this.metadata.discount_percentage, 10);
  }

  /**
   * Get monthly equivalent price for yearly plans
   * Example: €95.90/year = €7.99/month equivalent
   */
  getMonthlyEquivalentPrice(): string | null {
    if (this.getBillingPeriod() !== 'yearly') return null;

    if (this.metadata.monthly_equivalent) {
      const cents = parseInt(this.metadata.monthly_equivalent, 10);
      const eur = cents / 100;
      return `€${eur.toFixed(2)}/month`;
    }

    // Fallback: calculate from yearly price
    const monthlyEur = this.getPriceInEur() / 12;
    return `€${monthlyEur.toFixed(2)}/month`;
  }

  /**
   * Get yearly savings amount
   */
  getYearlySavingsEur(): number | null {
    if (this.getBillingPeriod() !== 'yearly') return null;

    if (this.metadata.savings_eur) {
      return parseInt(this.metadata.savings_eur, 10) / 100;
    }

    return null;
  }

  // ============================================================
  // Checks
  // ============================================================

  isRecurring(): boolean {
    return this.type === 'recurring';
  }

  isOneTime(): boolean {
    return this.type === 'one_time';
  }

  isMonthly(): boolean {
    return this.recurringInterval === 'month';
  }

  isYearly(): boolean {
    return this.recurringInterval === 'year';
  }

  isFree(): boolean {
    return this.unitAmount === 0;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  static create(params: {
    id: string;
    productId: string;
    active: boolean;
    currency: string;
    unitAmount: number;
    unitAmountDecimal?: string | null;
    type?: PriceType;
    billingScheme?: string;
    recurringInterval?: RecurringInterval | null;
    recurringIntervalCount?: number;
    recurringUsageType?: string | null;
    metadata: PriceMetadata;
    livemode?: boolean;
  }): Price {
    return new Price(
      params.id,
      'price',
      params.productId,
      params.active,
      params.currency,
      params.unitAmount,
      params.unitAmountDecimal ?? null,
      params.type ?? 'recurring',
      params.billingScheme ?? 'per_unit',
      params.recurringInterval ?? null,
      params.recurringIntervalCount ?? 1,
      params.recurringUsageType ?? 'licensed',
      params.metadata,
      new Date(),
      new Date(),
      params.livemode ?? false
    );
  }

  /**
   * Create a monthly price
   */
  static createMonthly(params: {
    id: string;
    productId: string;
    unitAmount: number;
    currency?: string;
    active?: boolean;
  }): Price {
    return Price.create({
      id: params.id,
      productId: params.productId,
      active: params.active ?? true,
      currency: params.currency ?? 'eur',
      unitAmount: params.unitAmount,
      recurringInterval: 'month',
      metadata: { billing_period: 'monthly' },
    });
  }

  /**
   * Create a yearly price with discount
   */
  static createYearly(params: {
    id: string;
    productId: string;
    unitAmount: number;
    discountPercentage: number;
    currency?: string;
    active?: boolean;
  }): Price {
    const monthlyEquivalent = Math.round(params.unitAmount / 12);

    return Price.create({
      id: params.id,
      productId: params.productId,
      active: params.active ?? true,
      currency: params.currency ?? 'eur',
      unitAmount: params.unitAmount,
      recurringInterval: 'year',
      metadata: {
        billing_period: 'yearly',
        discount_percentage: params.discountPercentage.toString(),
        monthly_equivalent: monthlyEquivalent.toString(),
      },
    });
  }

  // ============================================================
  // Stripe Compatibility
  // ============================================================

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      object: this.object,
      product: this.productId,
      active: this.active,
      currency: this.currency,
      unit_amount: this.unitAmount,
      unit_amount_decimal: this.unitAmountDecimal,
      type: this.type,
      billing_scheme: this.billingScheme,
      recurring: this.isRecurring()
        ? {
            interval: this.recurringInterval,
            interval_count: this.recurringIntervalCount,
            usage_type: this.recurringUsageType,
          }
        : null,
      metadata: this.metadata,
      created: Math.floor(this.created.getTime() / 1000),  // Unix timestamp
      updated: Math.floor(this.updated.getTime() / 1000),
      livemode: this.livemode,
    };
  }
}
