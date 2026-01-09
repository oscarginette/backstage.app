/**
 * PromoteUserToAdminUseCase
 *
 * Handles user promotion to admin role with security validation.
 * Implements Clean Architecture + SOLID principles.
 *
 * Business Rules:
 * - Validates admin secret before allowing promotion
 * - Finds user by email (case-insensitive)
 * - Updates user role to admin
 * - Returns updated user entity
 *
 * SECURITY: Admin secret must match environment variable
 * TEMPORARY: For development use only, should be replaced with proper RBAC
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { USER_ROLES } from '../types/user-roles';

export interface PromoteUserToAdminInput {
  email: string;
  secret: string;
}

export interface PromoteUserToAdminResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    role: string;
    active: boolean;
    createdAt: Date;
  };
}

/**
 * PromoteUserToAdminUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (user role promotion)
 * - OCP: Open for extension (easy to add role validation)
 * - LSP: Works with any repository implementation
 * - ISP: Uses specific interface only
 * - DIP: Depends on interface, not concrete class
 */
export class PromoteUserToAdminUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly expectedSecret: string
  ) {}

  /**
   * Execute user promotion to admin
   * @param input - Promotion data with email and secret
   * @returns PromoteUserToAdminResult with updated user info
   */
  async execute(input: PromoteUserToAdminInput): Promise<PromoteUserToAdminResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Verify admin secret
      if (input.secret !== this.expectedSecret) {
        return { success: false, error: 'Invalid secret' };
      }

      // 3. Update user role to admin
      const updatedUser = await this.userRepository.updateRole(
        input.email,
        USER_ROLES.ADMIN
      );

      // 4. Return success result
      return {
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          active: updatedUser.active,
          createdAt: updatedUser.createdAt,
        },
      };
    } catch (error) {
      console.error('PromoteUserToAdminUseCase.execute error:', error);

      // Handle user not found
      if (error instanceof Error && error.message.includes('not found')) {
        return { success: false, error: 'User not found' };
      }

      // Generic error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to promote user',
      };
    }
  }

  /**
   * Validate input data
   * @param input - Promotion data
   * @returns Error message or null if valid
   */
  private validateInput(input: PromoteUserToAdminInput): string | null {
    if (!input.email || typeof input.email !== 'string') {
      return 'Email is required';
    }

    if (!input.email.trim()) {
      return 'Email cannot be empty';
    }

    if (!input.secret || typeof input.secret !== 'string') {
      return 'Secret is required';
    }

    return null;
  }
}
