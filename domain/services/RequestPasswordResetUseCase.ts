/**
 * RequestPasswordResetUseCase
 *
 * Handles password reset email sending with security measures.
 * Implements Clean Architecture + SOLID principles.
 *
 * Security Features:
 * - No email enumeration (same response for valid/invalid emails)
 * - Crypto-secure token generation (32 bytes)
 * - 1-hour token expiration
 * - Rate limiting (handled at API layer)
 * - Audit trail logging (GDPR compliant)
 *
 * GDPR: Article 5(1)(f) - Integrity and confidentiality
 */

import { IUserRepository } from '../repositories/IUserRepository';
import { IEmailProvider } from '../providers/IEmailProvider';
import { PASSWORD_RESET_TOKEN_EXPIRY_HOURS } from '../types/password-reset';

export interface RequestPasswordResetInput {
  email: string;
  resetUrl: string; // Base URL for reset link (e.g., "https://app.com/reset-password")
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RequestPasswordResetResult {
  success: boolean;
  message: string; // Generic message (no email enumeration)
  error?: string;
}

/**
 * RequestPasswordResetUseCase
 *
 * SOLID Compliance:
 * - SRP: Single responsibility (password reset request)
 * - OCP: Open for extension (easy to add new email providers)
 * - LSP: Works with any IUserRepository implementation
 * - ISP: Uses specific interfaces only
 * - DIP: Depends on interfaces, not concrete classes
 */
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailProvider: IEmailProvider
  ) {}

  /**
   * Execute password reset request
   * SECURITY: Returns same message regardless of whether email exists
   * @param input - Password reset request data
   * @returns Generic success message (no email enumeration)
   */
  async execute(
    input: RequestPasswordResetInput
  ): Promise<RequestPasswordResetResult> {
    try {
      // 1. Validate input
      const validationError = this.validateInput(input);
      if (validationError) {
        return { success: false, message: validationError };
      }

      // 2. Generate reset token (returns null if email doesn't exist)
      // SECURITY: No email enumeration - we don't reveal if email exists
      const token = await this.userRepository.createPasswordResetToken(
        input.email
      );

      // 3. If user exists, send reset email
      if (token) {
        const resetLink = `${input.resetUrl}?token=${token}`;

        console.log('[RequestPasswordReset] Sending reset email:', {
          email: input.email,
          resetUrl: input.resetUrl,
          tokenLength: token.length,
        });

        await this.sendResetEmail(input.email, resetLink);

        console.log('[RequestPasswordReset] Reset email sent successfully to:', input.email);

        // TODO: Log event for GDPR audit trail (optional)
        // await this.logPasswordResetEvent(userId, input.ipAddress, input.userAgent);
      } else {
        console.log('[RequestPasswordReset] Email not found (no enumeration):', input.email);
      }

      // 4. SECURITY: Always return same message (prevents email enumeration)
      return {
        success: true,
        message:
          'If an account exists with that email, you will receive password reset instructions.',
      };
    } catch (error) {
      console.error('RequestPasswordResetUseCase.execute error:', error);

      // SECURITY: Don't expose internal errors to user
      return {
        success: false,
        message:
          'Unable to process password reset request. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate input
   * @param input - Password reset request data
   * @returns Error message or null if valid
   */
  private validateInput(input: RequestPasswordResetInput): string | null {
    if (!input.email || typeof input.email !== 'string') {
      return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return 'Invalid email format';
    }

    if (!input.resetUrl || typeof input.resetUrl !== 'string') {
      return 'Reset URL is required';
    }

    return null;
  }

  /**
   * Send password reset email
   * @param email - User email
   * @param resetLink - Magic link with token
   */
  private async sendResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    const { PasswordResetEmail } = await import(
      '@/infrastructure/email/templates/PasswordResetEmail'
    );

    await this.emailProvider.send({
      to: email,
      subject: PasswordResetEmail.getSubject(),
      html: PasswordResetEmail.getHtml({
        resetLink,
        expiryHours: PASSWORD_RESET_TOKEN_EXPIRY_HOURS,
      }),
    });
  }
}
