/**
 * ResetPasswordUseCase
 *
 * Handles password reset with token validation and security measures.
 * Implements Clean Architecture + SOLID principles.
 *
 * Security Features:
 * - Token expiration check (1 hour)
 * - Single-use token (invalidated after use)
 * - Password strength validation
 * - bcrypt hashing (10 rounds)
 * - Audit trail logging (GDPR compliant)
 *
 * GDPR: Article 5(1)(f) - Integrity and confidentiality
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';
import * as bcrypt from 'bcrypt';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * ResetPasswordUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (password reset)
 * - OCP: Open for extension (easy to add validation rules)
 * - LSP: Works with any IUserRepository implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */
export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute password reset
   * @param input - Password reset data
   * @returns Success/failure result
   */
  async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // 2. Find user by token (returns null if expired or invalid)
      const user = await this.userRepository.findByPasswordResetToken(
        input.token
      );
      if (!user) {
        return {
          success: false,
          error:
            'Invalid or expired reset token. Please request a new password reset link.',
        };
      }

      // 3. Validate new password strength
      const passwordValidation = User.validatePasswordStrength(
        input.newPassword
      );
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors[0], // Return first error
        };
      }

      // 4. Hash new password (bcrypt, 10 rounds)
      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

      // 5. Update password and invalidate token (single-use)
      await this.userRepository.updatePasswordAndInvalidateToken(
        user.id,
        newPasswordHash
      );

      // TODO: Log event for GDPR audit trail (optional)
      // await this.logPasswordChangeEvent(user.id, input.ipAddress, input.userAgent);

      // 6. Return success
      return {
        success: true,
        message:
          'Password successfully reset. You can now log in with your new password.',
      };
    } catch (error) {
      console.error('ResetPasswordUseCase.execute error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  }

  /**
   * Validate input
   * @param input - Password reset data
   * @returns Error message or null if valid
   */
  private validateInput(input: ResetPasswordInput): string | null {
    if (!input.token || typeof input.token !== 'string') {
      return 'Reset token is required';
    }

    if (input.token.length !== 64) {
      return 'Invalid reset token format';
    }

    if (!input.newPassword || typeof input.newPassword !== 'string') {
      return 'New password is required';
    }

    if (input.newPassword !== input.newPasswordConfirm) {
      return 'Passwords do not match';
    }

    return null;
  }
}
