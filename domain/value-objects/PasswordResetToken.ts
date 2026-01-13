/**
 * PasswordResetToken Value Object
 *
 * Handles password reset token generation and hashing.
 * Implements security best practices for token storage.
 *
 * Security Features:
 * - Crypto-secure random token generation (32 bytes)
 * - SHA-256 hashing for storage (prevents token leakage if DB compromised)
 * - Constant-time comparison resistant to timing attacks
 * - Immutable value object (SOLID principles)
 *
 * OWASP: Secure token storage best practices
 * GDPR: Article 5(1)(f) - Integrity and confidentiality
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { PASSWORD_RESET_TOKEN_LENGTH } from '../types/password-reset';

export class PasswordResetToken {
  /**
   * Generate a new crypto-secure password reset token
   * @returns Object with plaintext token (for email) and hashed token (for DB)
   */
  static generate(): { plaintextToken: string; hashedToken: string } {
    // Generate 32 random bytes, encode as hex (64 characters)
    const plaintextToken = randomBytes(32).toString('hex');

    // Hash the token for storage (prevents leakage if DB compromised)
    const hashedToken = this.hash(plaintextToken);

    return { plaintextToken, hashedToken };
  }

  /**
   * Hash a password reset token using SHA-256
   * @param token - Plaintext token to hash
   * @returns Hashed token (64-char hex string)
   */
  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify that a plaintext token matches a hashed token
   * Uses constant-time comparison to prevent timing attacks
   * @param plaintextToken - Token from user (e.g., from email link)
   * @param hashedToken - Hashed token from database
   * @returns True if tokens match
   */
  static verify(plaintextToken: string, hashedToken: string): boolean {
    // Validate input format first
    if (!this.isValidFormat(plaintextToken)) {
      return false;
    }

    // Hash the plaintext token
    const hashedInput = this.hash(plaintextToken);

    // Use timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(hashedInput, 'hex'),
        Buffer.from(hashedToken, 'hex')
      );
    } catch (error) {
      // If buffers are different lengths, timingSafeEqual throws
      return false;
    }
  }

  /**
   * Validate token format (64-character hex string)
   * @param token - Token to validate
   * @returns True if format is valid
   */
  static isValidFormat(token: string): boolean {
    if (typeof token !== 'string') {
      return false;
    }

    if (token.length !== PASSWORD_RESET_TOKEN_LENGTH) {
      return false;
    }

    // Check if it's a valid hex string
    return /^[a-f0-9]{64}$/i.test(token);
  }
}
