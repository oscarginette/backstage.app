/**
 * PasswordResetToken Unit Tests
 *
 * Tests the security features of password reset token hashing
 */

import { PasswordResetToken } from '@/domain/value-objects/PasswordResetToken';

describe('PasswordResetToken', () => {
  describe('generate()', () => {
    it('should generate a 64-character plaintext token', () => {
      const { plaintextToken } = PasswordResetToken.generate();
      expect(plaintextToken).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(plaintextToken)).toBe(true);
    });

    it('should generate a 64-character hashed token', () => {
      const { hashedToken } = PasswordResetToken.generate();
      expect(hashedToken).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(hashedToken)).toBe(true);
    });

    it('should generate different plaintext and hashed tokens', () => {
      const { plaintextToken, hashedToken } = PasswordResetToken.generate();
      expect(plaintextToken).not.toBe(hashedToken);
    });

    it('should generate unique tokens on each call', () => {
      const token1 = PasswordResetToken.generate();
      const token2 = PasswordResetToken.generate();
      expect(token1.plaintextToken).not.toBe(token2.plaintextToken);
      expect(token1.hashedToken).not.toBe(token2.hashedToken);
    });
  });

  describe('hash()', () => {
    it('should hash a token to a 64-character hex string', () => {
      const token = 'a'.repeat(64);
      const hashed = PasswordResetToken.hash(token);
      expect(hashed).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/i.test(hashed)).toBe(true);
    });

    it('should produce consistent hashes for the same input', () => {
      const token = 'test-token-123456789012345678901234567890123456789012345678';
      const hash1 = PasswordResetToken.hash(token);
      const hash2 = PasswordResetToken.hash(token);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const token1 = 'a'.repeat(64);
      const token2 = 'b'.repeat(64);
      const hash1 = PasswordResetToken.hash(token1);
      const hash2 = PasswordResetToken.hash(token2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify()', () => {
    it('should verify a valid plaintext token against its hash', () => {
      const { plaintextToken, hashedToken } = PasswordResetToken.generate();
      const isValid = PasswordResetToken.verify(plaintextToken, hashedToken);
      expect(isValid).toBe(true);
    });

    it('should reject an invalid plaintext token', () => {
      const { hashedToken } = PasswordResetToken.generate();
      const wrongToken = 'a'.repeat(64);
      const isValid = PasswordResetToken.verify(wrongToken, hashedToken);
      expect(isValid).toBe(false);
    });

    it('should reject tokens with invalid length', () => {
      const shortToken = 'abc123';
      const hashedToken = PasswordResetToken.hash('a'.repeat(64));
      const isValid = PasswordResetToken.verify(shortToken, hashedToken);
      expect(isValid).toBe(false);
    });

    it('should reject non-hex tokens', () => {
      const invalidToken = 'z'.repeat(64); // 'z' is not a valid hex character
      const hashedToken = PasswordResetToken.hash('a'.repeat(64));
      const isValid = PasswordResetToken.verify(invalidToken, hashedToken);
      expect(isValid).toBe(false);
    });

    it('should handle different length hashes gracefully', () => {
      const plaintextToken = 'a'.repeat(64);
      const invalidHash = 'abc123'; // Too short
      const isValid = PasswordResetToken.verify(plaintextToken, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('isValidFormat()', () => {
    it('should accept a valid 64-character hex token', () => {
      const validToken = 'a'.repeat(64);
      expect(PasswordResetToken.isValidFormat(validToken)).toBe(true);
    });

    it('should accept mixed case hex tokens', () => {
      // Create exactly 64 hex characters with mixed case
      const validToken = 'aAbBcCdDeEfF0123456789'.repeat(2) + 'aAbBcCdDeEfF01234567'; // 64 chars
      expect(validToken).toHaveLength(64);
      expect(PasswordResetToken.isValidFormat(validToken)).toBe(true);
    });

    it('should reject tokens that are too short', () => {
      const shortToken = 'abc123';
      expect(PasswordResetToken.isValidFormat(shortToken)).toBe(false);
    });

    it('should reject tokens that are too long', () => {
      const longToken = 'a'.repeat(65);
      expect(PasswordResetToken.isValidFormat(longToken)).toBe(false);
    });

    it('should reject non-hex tokens', () => {
      const invalidToken = 'z'.repeat(64);
      expect(PasswordResetToken.isValidFormat(invalidToken)).toBe(false);
    });

    it('should reject non-string tokens', () => {
      expect(PasswordResetToken.isValidFormat(null as any)).toBe(false);
      expect(PasswordResetToken.isValidFormat(undefined as any)).toBe(false);
      expect(PasswordResetToken.isValidFormat(123 as any)).toBe(false);
    });
  });

  describe('Security properties', () => {
    it('should use SHA-256 hashing (produces 64 hex chars = 32 bytes)', () => {
      const token = 'test-token-123456789012345678901234567890123456789012345678';
      const hash = PasswordResetToken.hash(token);
      // SHA-256 produces 32 bytes, which is 64 hex characters
      expect(hash).toHaveLength(64);
    });

    it('should use timing-safe comparison (verify should not leak timing info)', () => {
      // This is a behavioral test - we can't directly test timing,
      // but we can verify that incorrect tokens are consistently rejected
      const { plaintextToken, hashedToken } = PasswordResetToken.generate();

      const wrongToken1 = 'a'.repeat(64);
      const wrongToken2 = 'b'.repeat(64);

      // Both should be rejected
      expect(PasswordResetToken.verify(wrongToken1, hashedToken)).toBe(false);
      expect(PasswordResetToken.verify(wrongToken2, hashedToken)).toBe(false);

      // Only correct token should be accepted
      expect(PasswordResetToken.verify(plaintextToken, hashedToken)).toBe(true);
    });

    it('should prevent plaintext token storage (hashedToken ≠ plaintextToken)', () => {
      const { plaintextToken, hashedToken } = PasswordResetToken.generate();

      // Hashed token should NEVER equal plaintext token
      expect(plaintextToken).not.toBe(hashedToken);

      // Even if attacker has DB access, they cannot use the hashed token
      expect(PasswordResetToken.verify(hashedToken, hashedToken)).toBe(false);
    });
  });
});
