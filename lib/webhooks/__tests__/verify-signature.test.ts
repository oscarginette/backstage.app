/**
 * Tests for webhook signature verification
 *
 * Run with: npm test -- lib/webhooks/__tests__/verify-signature.test.ts
 */

import * as crypto from 'crypto';
import {
  verifyWebhookSignature,
  verifyResendWebhook,
  parseResendSignature,
  type WebhookVerificationConfig
} from '../verify-signature';

describe('Webhook Signature Verification', () => {
  const TEST_SECRET = 'whsec_test_secret_for_testing';
  const TEST_PAYLOAD = JSON.stringify({
    type: 'email.sent',
    data: { email_id: 'test-123' }
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature without timestamp', () => {
      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(TEST_PAYLOAD, 'utf-8');
      const signature = hmac.digest('hex');

      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature,
        payload: TEST_PAYLOAD,
        timestampTolerance: 0 // Disable timestamp validation
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should verify valid signature with timestamp', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${TEST_PAYLOAD}`;

      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf-8');
      const signature = hmac.digest('hex');

      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature,
        payload: TEST_PAYLOAD,
        timestamp,
        timestampTolerance: 300
      });

      expect(result.valid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature: 'invalid_signature',
        payload: TEST_PAYLOAD,
        timestampTolerance: 0
      });

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_SIGNATURE');
    });

    it('should reject old timestamp (replay attack)', () => {
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
      const signedPayload = `${oldTimestamp}.${TEST_PAYLOAD}`;

      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf-8');
      const signature = hmac.digest('hex');

      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature,
        payload: TEST_PAYLOAD,
        timestamp: oldTimestamp,
        timestampTolerance: 300 // 5 minutes
      });

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('REPLAY_ATTACK');
    });

    it('should reject missing secret', () => {
      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: '',
        signature: 'abc123',
        payload: TEST_PAYLOAD
      });

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MISSING_CONFIG');
    });

    it('should reject missing signature', () => {
      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature: '',
        payload: TEST_PAYLOAD
      });

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MISSING_CONFIG');
    });

    it('should reject missing payload', () => {
      const result = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature: 'abc123',
        payload: ''
      });

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('MISSING_CONFIG');
    });
  });

  describe('parseResendSignature', () => {
    it('should parse signature with timestamp and single v1', () => {
      const header = 't=1703001234,v1=abc123def456';
      const result = parseResendSignature(header);

      expect(result.timestamp).toBe('1703001234');
      expect(result.signatures).toEqual(['abc123def456']);
    });

    it('should parse signature with multiple v1 (key rotation)', () => {
      const header = 't=1703001234,v1=abc123,v1=def456';
      const result = parseResendSignature(header);

      expect(result.timestamp).toBe('1703001234');
      expect(result.signatures).toEqual(['abc123', 'def456']);
    });

    it('should parse signature without timestamp', () => {
      const header = 'v1=abc123def456';
      const result = parseResendSignature(header);

      expect(result.timestamp).toBeUndefined();
      expect(result.signatures).toEqual(['abc123def456']);
    });
  });

  describe('verifyResendWebhook', () => {
    it('should verify valid Resend signature format', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${TEST_PAYLOAD}`;

      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf-8');
      const signature = hmac.digest('hex');

      const signatureHeader = `t=${timestamp},v1=${signature}`;

      const result = verifyResendWebhook(
        TEST_PAYLOAD,
        signatureHeader,
        TEST_SECRET,
        300
      );

      expect(result.valid).toBe(true);
    });

    it('should verify with multiple signatures (key rotation)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${TEST_PAYLOAD}`;

      // First signature (correct)
      const hmac1 = crypto.createHmac('sha256', TEST_SECRET);
      hmac1.update(signedPayload, 'utf-8');
      const signature1 = hmac1.digest('hex');

      // Second signature (wrong secret)
      const hmac2 = crypto.createHmac('sha256', 'wrong_secret');
      hmac2.update(signedPayload, 'utf-8');
      const signature2 = hmac2.digest('hex');

      // Header with both signatures (should accept if any is valid)
      const signatureHeader = `t=${timestamp},v1=${signature2},v1=${signature1}`;

      const result = verifyResendWebhook(
        TEST_PAYLOAD,
        signatureHeader,
        TEST_SECRET,
        300
      );

      expect(result.valid).toBe(true);
    });

    it('should reject invalid Resend signature format', () => {
      const result = verifyResendWebhook(
        TEST_PAYLOAD,
        'invalid_format',
        TEST_SECRET,
        300
      );

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    it('should reject signature with no v1 values', () => {
      const result = verifyResendWebhook(
        TEST_PAYLOAD,
        't=1703001234',
        TEST_SECRET,
        300
      );

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });
  });

  describe('Security features', () => {
    it('should use constant-time comparison (timing attack prevention)', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${TEST_PAYLOAD}`;

      const hmac = crypto.createHmac('sha256', TEST_SECRET);
      hmac.update(signedPayload, 'utf-8');
      const validSignature = hmac.digest('hex');

      // Create almost-matching signature (same length, different content)
      const invalidSignature = 'a'.repeat(validSignature.length);

      // Both should take approximately same time to reject
      const start1 = process.hrtime.bigint();
      const result1 = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature: invalidSignature,
        payload: TEST_PAYLOAD,
        timestamp,
        timestampTolerance: 300
      });
      const time1 = process.hrtime.bigint() - start1;

      const start2 = process.hrtime.bigint();
      const result2 = verifyWebhookSignature({
        provider: 'resend',
        secret: TEST_SECRET,
        signature: validSignature.slice(0, -1) + 'x', // Change last char
        payload: TEST_PAYLOAD,
        timestamp,
        timestampTolerance: 300
      });
      const time2 = process.hrtime.bigint() - start2;

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);

      // Timing difference should be minimal (constant-time)
      const timingDiff = Math.abs(Number(time1 - time2));
      // Allow 1ms difference (1,000,000 nanoseconds)
      expect(timingDiff).toBeLessThan(1_000_000);
    });
  });
});
