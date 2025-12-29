import { Subscription } from '../entities/Subscription';
import type { SubscriptionStatus } from '../types/stripe';

/**
 * ISubscriptionRepository
 *
 * Repository interface for Subscription entity (Dependency Inversion Principle).
 * Infrastructure layer will implement PostgreSQL version.
 */
export interface ISubscriptionRepository {
  /**
   * Create new subscription
   */
  create(subscription: Subscription): Promise<Subscription>;

  /**
   * Find subscription by ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Find all subscriptions for a customer (user)
   */
  findByCustomerId(customerId: number): Promise<Subscription[]>;

  /**
   * Find active subscription for a customer
   * Returns the most recent active subscription
   */
  findActiveByCustomerId(customerId: number): Promise<Subscription | null>;

  /**
   * Find subscriptions by status
   */
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;

  /**
   * Find subscriptions expiring within N days
   */
  findExpiringSoon(days: number): Promise<Subscription[]>;

  /**
   * Update subscription status
   */
  updateStatus(id: string, status: SubscriptionStatus): Promise<void>;

  /**
   * Cancel subscription
   */
  cancel(id: string, canceledAt: Date): Promise<void>;

  /**
   * Delete subscription (soft delete)
   */
  delete(id: string): Promise<void>;
}
