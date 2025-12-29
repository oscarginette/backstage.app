/**
 * Stripe-compatible type definitions
 * These types mirror Stripe's API structure for easy migration
 */

// ============================================================
// Billing Period (Recurring Interval)
// ============================================================

export type RecurringInterval = 'day' | 'week' | 'month' | 'year';

export type BillingPeriod = 'monthly' | 'yearly';

// Helper to convert billing period to recurring interval
export function billingPeriodToInterval(period: BillingPeriod): RecurringInterval {
  return period === 'yearly' ? 'year' : 'month';
}

// Helper to convert recurring interval to billing period
export function intervalToBillingPeriod(interval: RecurringInterval): BillingPeriod {
  return interval === 'year' ? 'yearly' : 'monthly';
}

// Helper to get duration in months
export function getDurationMonths(period: BillingPeriod): number {
  return period === 'yearly' ? 12 : 1;
}

// Helper to get discount percentage
export function getDiscountPercentage(period: BillingPeriod): number {
  return period === 'yearly' ? 20 : 0;
}

// Helper to format billing period for UI
export function formatBillingPeriod(period: BillingPeriod): string {
  return period === 'yearly' ? 'Annual' : 'Monthly';
}

// ============================================================
// Subscription Status (Stripe enum)
// ============================================================

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export const ACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'active',
  'trialing',
];

export const INACTIVE_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'canceled',
  'unpaid',
  'paused',
  'incomplete_expired',
];

// ============================================================
// Invoice Status (Stripe enum)
// ============================================================

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

// ============================================================
// Billing Reason (Stripe enum)
// ============================================================

export type BillingReason =
  | 'subscription_create'
  | 'subscription_cycle'
  | 'subscription_update'
  | 'manual';

// ============================================================
// Price Type (Stripe enum)
// ============================================================

export type PriceType = 'one_time' | 'recurring';

// ============================================================
// Collection Method (Stripe enum)
// ============================================================

export type CollectionMethod = 'charge_automatically' | 'send_invoice';

// ============================================================
// Marketing Feature (Stripe structure)
// ============================================================

export interface MarketingFeature {
  name: string;
}

// ============================================================
// Product Metadata (Custom)
// ============================================================

export interface ProductMetadata {
  max_contacts: string;
  max_monthly_emails: string;
  max_active_gates: string;
  plan_tier: string;
}

// ============================================================
// Price Metadata (Custom)
// ============================================================

export interface PriceMetadata {
  billing_period: BillingPeriod;
  discount_percentage?: string;
  monthly_equivalent?: string;
  savings_eur?: string;
}

// ============================================================
// Subscription Metadata (Custom)
// ============================================================

export interface SubscriptionMetadata {
  activated_by?: string;
  activation_method?: 'manual' | 'stripe' | 'admin';
  notes?: string;
  product_name?: string;
  price_id?: string;
  billing_period?: string;
  created_via?: string;
  [key: string]: string | undefined;  // Allow additional metadata
}

// ============================================================
// Event Types (Stripe webhook event names)
// ============================================================

export type EventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.created'
  | 'invoice.finalized'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.voided';
