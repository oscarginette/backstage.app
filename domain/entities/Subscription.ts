import type {
  SubscriptionStatus,
  CollectionMethod,
  SubscriptionMetadata,
} from '../types/stripe';
import { ACTIVE_SUBSCRIPTION_STATUSES } from '../types/stripe';

/**
 * Subscription Entity (Stripe-compatible)
 *
 * Represents a user's subscription to a product with recurring billing.
 * Links a customer (user) to a price through subscription_items.
 *
 * Mirrors: https://docs.stripe.com/api/subscriptions/object
 */
export class Subscription {
  constructor(
    public readonly id: string,  // Format: sub_xxxxx
    public readonly object: string,  // Always 'subscription'
    public readonly customerId: number,  // Reference to users.id
    public readonly status: SubscriptionStatus,
    public readonly currentPeriodStart: Date,
    public readonly currentPeriodEnd: Date,
    public readonly billingCycleAnchor: Date,
    public readonly cancelAtPeriodEnd: boolean,
    public readonly cancelAt: Date | null,
    public readonly canceledAt: Date | null,
    public readonly endedAt: Date | null,
    public readonly trialStart: Date | null,
    public readonly trialEnd: Date | null,
    public readonly created: Date,
    public readonly startDate: Date,
    public readonly metadata: SubscriptionMetadata,
    public readonly collectionMethod: CollectionMethod,
    public readonly livemode: boolean
  ) {
    this.validate();
    Object.freeze(this);  // Immutable
  }

  // ============================================================
  // Validation
  // ============================================================

  private validate(): void {
    if (!this.id || !this.id.startsWith('sub_')) {
      throw new Error('Subscription ID must start with "sub_"');
    }

    if (this.object !== 'subscription') {
      throw new Error('Object must be "subscription"');
    }

    if (this.customerId <= 0) {
      throw new Error('Customer ID must be positive');
    }

    if (this.currentPeriodEnd <= this.currentPeriodStart) {
      throw new Error('Current period end must be after start');
    }
  }

  // ============================================================
  // Status Checks
  // ============================================================

  isActive(): boolean {
    return ACTIVE_SUBSCRIPTION_STATUSES.includes(this.status);
  }

  isCanceled(): boolean {
    return this.status === 'canceled';
  }

  isTrialing(): boolean {
    return this.status === 'trialing';
  }

  isPastDue(): boolean {
    return this.status === 'past_due';
  }

  isIncomplete(): boolean {
    return this.status === 'incomplete' || this.status === 'incomplete_expired';
  }

  willCancelAtPeriodEnd(): boolean {
    return this.cancelAtPeriodEnd;
  }

  // ============================================================
  // Period Calculations
  // ============================================================

  /**
   * Get days until current period ends
   */
  getDaysUntilPeriodEnd(): number {
    const now = new Date();
    const diff = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if subscription is expiring soon (within 7 days)
   */
  isExpiringSoon(): boolean {
    const days = this.getDaysUntilPeriodEnd();
    return days > 0 && days <= 7;
  }

  /**
   * Check if subscription has expired
   */
  hasExpired(): boolean {
    return new Date() > this.currentPeriodEnd;
  }

  /**
   * Get subscription duration in months
   */
  getDurationMonths(): number {
    const diffMs = this.currentPeriodEnd.getTime() - this.currentPeriodStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.round(diffDays / 30);  // Approximate
  }

  /**
   * Check if this is an annual subscription
   */
  isAnnual(): boolean {
    return this.getDurationMonths() >= 12;
  }

  // ============================================================
  // Trial Methods
  // ============================================================

  hasTrialPeriod(): boolean {
    return this.trialStart !== null && this.trialEnd !== null;
  }

  isInTrial(): boolean {
    if (!this.hasTrialPeriod() || !this.trialEnd) return false;

    const now = new Date();
    return now < this.trialEnd && this.status === 'trialing';
  }

  getDaysUntilTrialEnd(): number | null {
    if (!this.trialEnd || !this.isInTrial()) return null;

    const now = new Date();
    const diff = this.trialEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ============================================================
  // Formatting
  // ============================================================

  getFormattedStatus(): string {
    const statusMap: Record<SubscriptionStatus, string> = {
      incomplete: 'Incomplete',
      incomplete_expired: 'Incomplete (Expired)',
      trialing: 'Trial',
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
      unpaid: 'Unpaid',
      paused: 'Paused',
    };

    return statusMap[this.status] || this.status;
  }

  getFormattedPeriod(): string {
    const start = this.currentPeriodStart.toLocaleDateString();
    const end = this.currentPeriodEnd.toLocaleDateString();
    return `${start} - ${end}`;
  }

  // ============================================================
  // Factory Methods
  // ============================================================

  static create(params: {
    id: string;
    customerId: number;
    status?: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    billingCycleAnchor: Date;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: Date | null;
    canceledAt?: Date | null;
    endedAt?: Date | null;
    trialStart?: Date | null;
    trialEnd?: Date | null;
    startDate?: Date;
    metadata?: SubscriptionMetadata;
    collectionMethod?: CollectionMethod;
    livemode?: boolean;
  }): Subscription {
    return new Subscription(
      params.id,
      'subscription',
      params.customerId,
      params.status ?? 'active',
      params.currentPeriodStart,
      params.currentPeriodEnd,
      params.billingCycleAnchor,
      params.cancelAtPeriodEnd ?? false,
      params.cancelAt ?? null,
      params.canceledAt ?? null,
      params.endedAt ?? null,
      params.trialStart ?? null,
      params.trialEnd ?? null,
      new Date(),
      params.startDate ?? new Date(),
      params.metadata ?? {},
      params.collectionMethod ?? 'charge_automatically',
      params.livemode ?? false
    );
  }

  /**
   * Create a subscription for a given number of months
   */
  static createForMonths(params: {
    id: string;
    customerId: number;
    months: number;
    startDate?: Date;
    metadata?: SubscriptionMetadata;
  }): Subscription {
    const startDate = params.startDate ?? new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + params.months);

    return Subscription.create({
      id: params.id,
      customerId: params.customerId,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      billingCycleAnchor: startDate,
      startDate,
      metadata: params.metadata,
    });
  }

  // ============================================================
  // Update Methods (return new immutable instance)
  // ============================================================

  /**
   * Mark subscription as canceled
   */
  cancel(canceledAt?: Date): Subscription {
    return new Subscription(
      this.id,
      this.object,
      this.customerId,
      'canceled',
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.billingCycleAnchor,
      this.cancelAtPeriodEnd,
      this.cancelAt,
      canceledAt ?? new Date(),
      new Date(),
      this.trialStart,
      this.trialEnd,
      this.created,
      this.startDate,
      this.metadata,
      this.collectionMethod,
      this.livemode
    );
  }

  /**
   * Schedule cancellation at period end
   */
  scheduleCancellation(): Subscription {
    return new Subscription(
      this.id,
      this.object,
      this.customerId,
      this.status,
      this.currentPeriodStart,
      this.currentPeriodEnd,
      this.billingCycleAnchor,
      true,  // cancel_at_period_end
      this.currentPeriodEnd,  // cancel_at
      null,
      null,
      this.trialStart,
      this.trialEnd,
      this.created,
      this.startDate,
      this.metadata,
      this.collectionMethod,
      this.livemode
    );
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
      customer: this.customerId.toString(),
      status: this.status,
      current_period_start: Math.floor(this.currentPeriodStart.getTime() / 1000),
      current_period_end: Math.floor(this.currentPeriodEnd.getTime() / 1000),
      billing_cycle_anchor: Math.floor(this.billingCycleAnchor.getTime() / 1000),
      cancel_at_period_end: this.cancelAtPeriodEnd,
      cancel_at: this.cancelAt ? Math.floor(this.cancelAt.getTime() / 1000) : null,
      canceled_at: this.canceledAt ? Math.floor(this.canceledAt.getTime() / 1000) : null,
      ended_at: this.endedAt ? Math.floor(this.endedAt.getTime() / 1000) : null,
      trial_start: this.trialStart ? Math.floor(this.trialStart.getTime() / 1000) : null,
      trial_end: this.trialEnd ? Math.floor(this.trialEnd.getTime() / 1000) : null,
      created: Math.floor(this.created.getTime() / 1000),
      start_date: Math.floor(this.startDate.getTime() / 1000),
      metadata: this.metadata,
      collection_method: this.collectionMethod,
      livemode: this.livemode,
    };
  }
}
