import type {
  MarketingFeature,
  ProductMetadata,
} from '../types/stripe';

/**
 * Product Entity (Stripe-compatible)
 *
 * Represents a subscription product (e.g., "Pro", "Business", "Unlimited").
 * In Stripe, a Product can have multiple Prices (monthly, yearly, etc.).
 *
 * Mirrors: https://docs.stripe.com/api/products/object
 */
export class Product {
  constructor(
    public readonly id: string,  // Format: prod_Pro, prod_Business
    public readonly object: string,  // Always 'product'
    public readonly name: string,  // "Pro", "Business", "Unlimited"
    public readonly description: string | null,
    public readonly active: boolean,
    public readonly marketingFeatures: MarketingFeature[],
    public readonly metadata: ProductMetadata,
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
    if (!this.id || !this.id.startsWith('prod_')) {
      throw new Error('Product ID must start with "prod_"');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (this.object !== 'product') {
      throw new Error('Object must be "product"');
    }
  }

  // ============================================================
  // Getters
  // ============================================================

  getMaxContacts(): number {
    return parseInt(this.metadata.max_contacts, 10);
  }

  getMaxMonthlyEmails(): number | null {
    const value = parseInt(this.metadata.max_monthly_emails, 10);
    return value === 999999999 ? null : value;  // null = unlimited
  }

  getMaxActiveGates(): number {
    return parseInt(this.metadata.max_active_gates, 10);
  }

  getPlanTier(): number {
    return parseInt(this.metadata.plan_tier, 10);
  }

  isFree(): boolean {
    return this.name.toLowerCase() === 'free';
  }

  hasUnlimitedEmails(): boolean {
    return this.getMaxMonthlyEmails() === null;
  }

  // ============================================================
  // Comparison
  // ============================================================

  /**
   * Compare tier level with another product
   * Returns: -1 if this < other, 0 if equal, 1 if this > other
   */
  compareTier(other: Product): number {
    const thisTier = this.getPlanTier();
    const otherTier = other.getPlanTier();

    if (thisTier < otherTier) return -1;
    if (thisTier > otherTier) return 1;
    return 0;
  }

  isUpgradeTo(other: Product): boolean {
    return this.compareTier(other) < 0;
  }

  isDowngradeTo(other: Product): boolean {
    return this.compareTier(other) > 0;
  }

  // ============================================================
  // Formatting
  // ============================================================

  getFormattedContactLimit(): string {
    const contacts = this.getMaxContacts();
    if (contacts >= 100000) return '100,000+';
    return contacts.toLocaleString();
  }

  getFormattedEmailLimit(): string {
    const emails = this.getMaxMonthlyEmails();
    if (emails === null) return 'Unlimited';
    return emails.toLocaleString();
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  static create(params: {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    marketingFeatures: MarketingFeature[];
    metadata: ProductMetadata;
    livemode?: boolean;
  }): Product {
    return new Product(
      params.id,
      'product',
      params.name,
      params.description,
      params.active,
      params.marketingFeatures,
      params.metadata,
      new Date(),
      new Date(),
      params.livemode ?? false
    );
  }

  // ============================================================
  // Stripe Compatibility
  // ============================================================

  /**
   * Check if product can support a given contact count
   */
  supportsContactCount(count: number): boolean {
    return count <= this.getMaxContacts();
  }

  /**
   * Check if product can support a given email volume
   */
  supportsEmailVolume(volume: number): boolean {
    const limit = this.getMaxMonthlyEmails();
    return limit === null || volume <= limit;
  }

  /**
   * Convert to plain object (for JSON serialization)
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      object: this.object,
      name: this.name,
      description: this.description,
      active: this.active,
      marketing_features: this.marketingFeatures,
      metadata: this.metadata,
      created: this.created.toISOString(),
      updated: this.updated.toISOString(),
      livemode: this.livemode,
    };
  }
}
