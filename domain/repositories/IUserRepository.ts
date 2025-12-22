/**
 * IUserRepository Interface
 *
 * Repository contract for user operations.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Clean Architecture: Domain layer interface, implemented in infrastructure layer.
 */

import { User } from '../entities/User';

export interface CreateUserData {
  email: string;
  passwordHash: string;
}

export interface IUserRepository {
  /**
   * Create new user
   * @param data - User data with hashed password
   * @returns Created User entity
   * @throws Error if email already exists or creation fails
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Find user by email
   * @param email - User email (case-insensitive)
   * @returns User entity or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   * @param id - User identifier
   * @returns User entity or null if not found
   */
  findById(id: number): Promise<User | null>;

  /**
   * Update user's last session timestamp
   * Used by NextAuth to track login activity
   * @param userId - User identifier
   * @throws Error if user not found or update fails
   */
  updateLastSession(userId: number): Promise<void>;

  /**
   * Check if email already exists
   * @param email - User email (case-insensitive)
   * @returns True if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Get all users (admin only)
   * @returns Array of all users
   */
  findAll(): Promise<User[]>;

  /**
   * Toggle user active status (admin only)
   * @param userId - User identifier
   * @param active - New active status
   * @throws Error if user not found or update fails
   */
  updateActiveStatus(userId: number, active: boolean): Promise<void>;
}
