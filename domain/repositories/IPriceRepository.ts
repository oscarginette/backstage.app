import { Price } from '../entities/Price';
import type { BillingPeriod } from '../types/stripe';

/**
 * IPriceRepository
 *
 * Repository interface for Price entity (Dependency Inversion Principle).
 * Infrastructure layer will implement PostgreSQL version.
 */
export interface IPriceRepository {
  /**
   * Get all prices (including inactive)
   */
  findAll(): Promise<Price[]>;

  /**
   * Get only active prices
   */
  findActive(): Promise<Price[]>;

  /**
   * Find price by ID
   */
  findById(id: string): Promise<Price | null>;

  /**
   * Find all prices for a specific product
   */
  findByProductId(productId: string): Promise<Price[]>;

  /**
   * Find price for a specific product and billing period
   * Example: findByProductAndPeriod('prod_Pro', 'yearly')
   */
  findByProductAndPeriod(
    productId: string,
    period: BillingPeriod
  ): Promise<Price | null>;
}
