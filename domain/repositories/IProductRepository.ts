import { Product } from '../entities/Product';

/**
 * IProductRepository
 *
 * Repository interface for Product entity (Dependency Inversion Principle).
 * Infrastructure layer will implement PostgreSQL version.
 */
export interface IProductRepository {
  /**
   * Get all products (including inactive)
   */
  findAll(): Promise<Product[]>;

  /**
   * Get only active products
   */
  findActive(): Promise<Product[]>;

  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find product by name (case-insensitive)
   */
  findByName(name: string): Promise<Product | null>;
}
