/**
 * TokenEncryption
 *
 * Handles encryption and decryption of OAuth tokens for secure storage.
 * Uses AES-256-GCM for authenticated encryption with additional data.
 *
 * Security:
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - Key size: 256 bits (32 bytes)
 * - IV: Random 16 bytes per encryption
 * - Auth tag: 16 bytes for integrity verification
 *
 * Format: iv:authTag:encrypted (all base64 encoded)
 *
 * Environment Requirements:
 * - TOKEN_ENCRYPTION_KEY: 64-character hex string (32 bytes)
 *   Generate with: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '@/lib/env';

export class TokenEncryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Validate encryption key exists
    if (!env.TOKEN_ENCRYPTION_KEY) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -hex 32'
      );
    }

    // Validate key length (must be 64 hex characters = 32 bytes)
    if (env.TOKEN_ENCRYPTION_KEY.length !== 64) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes). Generate with: openssl rand -hex 32'
      );
    }

    try {
      this.key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex');
    } catch (error) {
      throw new Error(
        'Invalid TOKEN_ENCRYPTION_KEY format. Must be hexadecimal. Generate with: openssl rand -hex 32'
      );
    }

    // Verify key is exactly 32 bytes
    if (this.key.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - Text to encrypt (e.g., access token)
   * @returns Encrypted string in format: iv:authTag:encrypted (base64)
   * @throws Error if encryption fails
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random initialization vector (IV)
      const iv = randomBytes(16);

      // Create cipher
      const cipher = createCipheriv(this.algorithm, this.key, iv);

      // Encrypt
      const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted (all base64)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    } catch (error) {
      console.error('TokenEncryption.encrypt error:', error);
      throw new Error(
        `Failed to encrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   *
   * @param ciphertext - Encrypted string in format: iv:authTag:encrypted (base64)
   * @returns Decrypted plaintext
   * @throws Error if decryption fails or authentication fails
   */
  decrypt(ciphertext: string): string {
    try {
      // Parse components
      const parts = ciphertext.split(':');

      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected format: iv:authTag:encrypted');
      }

      const [ivB64, authTagB64, encryptedB64] = parts;

      // Decode from base64
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');

      // Validate component sizes
      if (iv.length !== 16) {
        throw new Error('Invalid IV length');
      }

      if (authTag.length !== 16) {
        throw new Error('Invalid auth tag length');
      }

      // Create decipher
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('TokenEncryption.decrypt error:', error);

      // Authentication failure means data has been tampered with
      if (error instanceof Error && error.message.includes('Unsupported state')) {
        throw new Error('Token decryption failed: authentication failed (data may be corrupted)');
      }

      throw new Error(
        `Failed to decrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify encryption key is properly configured (for health checks)
   *
   * @returns true if encryption is working correctly
   */
  isConfigured(): boolean {
    try {
      // Test encryption/decryption roundtrip
      const testPlaintext = 'test_token_123';
      const encrypted = this.encrypt(testPlaintext);
      const decrypted = this.decrypt(encrypted);

      return decrypted === testPlaintext;
    } catch (error) {
      console.error('TokenEncryption health check failed:', error);
      return false;
    }
  }
}
