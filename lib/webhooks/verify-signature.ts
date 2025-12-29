/**
 * Webhook Signature Verification
 *
 * Provides HMAC-SHA256 signature verification for webhooks from various providers.
 * Prevents malicious webhook injection attacks by validating signatures.
 *
 * Supported providers:
 * - Resend: Uses Resend-Signature header
 * - Stripe: Uses Stripe-Signature header (built-in via Stripe SDK)
 *
 * Security features:
 * - HMAC-SHA256 for cryptographic verification
 * - Timestamp validation to prevent replay attacks
 * - Constant-time comparison to prevent timing attacks
 *
 * References:
 * - Resend webhook docs: https://resend.com/docs/webhooks
 * - OWASP Webhook Security: https://cheatsheetseries.owasp.org/cheatsheets/Webhook_Security_Cheat_Sheet.html
 */

import crypto from 'crypto';

/**
 * Configuration for webhook signature verification
 */
export interface WebhookVerificationConfig {
  /** Provider name (for logging and error messages) */
  provider: 'resend' | 'stripe' | 'hypedit';

  /** Webhook secret from provider dashboard */
  secret: string;

  /** Signature from webhook header */
  signature: string;

  /** Raw request payload (must be raw string/buffer, NOT parsed JSON) */
  payload: string | Buffer;

  /**
   * Optional timestamp for replay attack prevention
   * Format: Unix timestamp in seconds (e.g., "1703001234")
   */
  timestamp?: string;

  /**
   * Optional tolerance for timestamp validation in seconds
   * Default: 300 (5 minutes)
   * Set to 0 to disable timestamp validation
   */
  timestampTolerance?: number;
}

/**
 * Verification result with detailed error information
 */
export interface VerificationResult {
  /** Whether signature is valid */
  valid: boolean;

  /** Error message if verification failed */
  error?: string;

  /** Error code for programmatic handling */
  errorCode?: 'INVALID_SIGNATURE' | 'REPLAY_ATTACK' | 'MISSING_CONFIG' | 'INVALID_FORMAT';
}

/**
 * Verifies webhook signature using HMAC-SHA256
 *
 * @example
 * ```typescript
 * const result = verifyWebhookSignature({
 *   provider: 'resend',
 *   secret: process.env.RESEND_WEBHOOK_SECRET!,
 *   signature: request.headers.get('resend-signature')!,
 *   payload: rawBody, // IMPORTANT: Must be raw string, NOT JSON
 *   timestamp: request.headers.get('resend-timestamp'),
 *   timestampTolerance: 300 // 5 minutes
 * });
 *
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 * ```
 */
export function verifyWebhookSignature(config: WebhookVerificationConfig): VerificationResult {
  const {
    provider,
    secret,
    signature,
    payload,
    timestamp,
    timestampTolerance = 300
  } = config;

  // 1. Validate input
  if (!secret) {
    return {
      valid: false,
      error: `Missing webhook secret for ${provider}`,
      errorCode: 'MISSING_CONFIG'
    };
  }

  if (!signature) {
    return {
      valid: false,
      error: `Missing signature header for ${provider}`,
      errorCode: 'MISSING_CONFIG'
    };
  }

  if (!payload) {
    return {
      valid: false,
      error: 'Missing payload',
      errorCode: 'MISSING_CONFIG'
    };
  }

  // 2. Verify timestamp if provided (replay attack prevention)
  if (timestamp && timestampTolerance > 0) {
    const timestampResult = verifyTimestamp(timestamp, timestampTolerance);
    if (!timestampResult.valid) {
      return timestampResult;
    }
  }

  // 3. Compute expected signature
  const expectedSignature = computeSignature(payload, secret, timestamp);

  // 4. Compare signatures using constant-time comparison (prevents timing attacks)
  const signatureValid = constantTimeCompare(signature, expectedSignature);

  if (!signatureValid) {
    return {
      valid: false,
      error: `Invalid ${provider} webhook signature`,
      errorCode: 'INVALID_SIGNATURE'
    };
  }

  return { valid: true };
}

/**
 * Computes HMAC-SHA256 signature for webhook payload
 *
 * Format depends on provider:
 * - Resend: HMAC-SHA256(timestamp.payload, secret) if timestamp provided
 * - Resend: HMAC-SHA256(payload, secret) if no timestamp
 *
 * @param payload - Raw request body (string or Buffer)
 * @param secret - Webhook secret
 * @param timestamp - Optional timestamp for signed message
 * @returns Hex-encoded signature
 */
function computeSignature(
  payload: string | Buffer,
  secret: string,
  timestamp?: string
): string {
  const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf-8') : payload;

  // Include timestamp in signed message if provided (Resend format)
  const signedPayload = timestamp
    ? `${timestamp}.${payloadString}`
    : payloadString;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload, 'utf-8');

  return hmac.digest('hex');
}

/**
 * Verifies timestamp is within acceptable tolerance
 *
 * Prevents replay attacks by rejecting old webhooks.
 *
 * @param timestamp - Unix timestamp in seconds
 * @param tolerance - Maximum age in seconds (default: 300 = 5 minutes)
 */
function verifyTimestamp(timestamp: string, tolerance: number): VerificationResult {
  const webhookTime = parseInt(timestamp, 10);

  if (isNaN(webhookTime)) {
    return {
      valid: false,
      error: 'Invalid timestamp format',
      errorCode: 'INVALID_FORMAT'
    };
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = Math.abs(currentTime - webhookTime);

  if (timeDiff > tolerance) {
    return {
      valid: false,
      error: `Webhook timestamp too old (${timeDiff}s ago, max: ${tolerance}s)`,
      errorCode: 'REPLAY_ATTACK'
    };
  }

  return { valid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks
 *
 * Uses crypto.timingSafeEqual for cryptographically secure comparison.
 * Falls back to manual comparison if lengths don't match.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    const bufferA = Buffer.from(a, 'utf-8');
    const bufferB = Buffer.from(b, 'utf-8');

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    // Fallback for compatibility (though should never happen with equal-length strings)
    return a === b;
  }
}

/**
 * Helper: Parses Resend signature header
 *
 * Resend signatures may include multiple signatures for key rotation.
 * Format: "t=timestamp,v1=signature1,v1=signature2"
 *
 * @param signatureHeader - Full Resend-Signature header value
 * @returns Parsed signature components
 */
export function parseResendSignature(signatureHeader: string): {
  timestamp?: string;
  signatures: string[];
} {
  const parts = signatureHeader.split(',');
  const result: { timestamp?: string; signatures: string[] } = {
    signatures: []
  };

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 't') {
      result.timestamp = value;
    } else if (key === 'v1') {
      result.signatures.push(value);
    }
  }

  return result;
}

/**
 * Helper: Verifies Resend webhook signature (convenience wrapper)
 *
 * Handles Resend's specific signature format with timestamp and multiple signatures.
 *
 * @example
 * ```typescript
 * const rawBody = await request.text(); // IMPORTANT: Use .text() not .json()
 * const signatureHeader = request.headers.get('resend-signature')!;
 *
 * const result = verifyResendWebhook(
 *   rawBody,
 *   signatureHeader,
 *   process.env.RESEND_WEBHOOK_SECRET!
 * );
 *
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 * ```
 */
export function verifyResendWebhook(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string,
  timestampTolerance: number = 300
): VerificationResult {
  // Parse Resend signature format: "t=timestamp,v1=signature1,v1=signature2"
  const parsed = parseResendSignature(signatureHeader);

  if (parsed.signatures.length === 0) {
    return {
      valid: false,
      error: 'No signatures found in Resend-Signature header',
      errorCode: 'INVALID_FORMAT'
    };
  }

  // Try each signature (supports key rotation)
  for (const signature of parsed.signatures) {
    const result = verifyWebhookSignature({
      provider: 'resend',
      secret,
      signature,
      payload,
      timestamp: parsed.timestamp,
      timestampTolerance
    });

    if (result.valid) {
      return result;
    }
  }

  // All signatures failed
  return {
    valid: false,
    error: 'Invalid Resend webhook signature',
    errorCode: 'INVALID_SIGNATURE'
  };
}

/**
 * Helper: Verifies Stripe webhook signature (convenience wrapper)
 *
 * NOTE: Prefer using stripe.webhooks.constructEvent() for Stripe webhooks.
 * This is provided for consistency with other providers.
 *
 * @example
 * ```typescript
 * // RECOMMENDED: Use Stripe SDK
 * import Stripe from 'stripe';
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *
 * try {
 *   const event = stripe.webhooks.constructEvent(
 *     rawBody,
 *     request.headers.get('stripe-signature')!,
 *     process.env.STRIPE_WEBHOOK_SECRET!
 *   );
 * } catch (err) {
 *   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
 * }
 * ```
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string
): VerificationResult {
  // Stripe signature format: "t=timestamp,v1=signature"
  // Similar to Resend but uses different scheme
  const parts = signatureHeader.split(',');
  let timestamp: string | undefined;
  let signature: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split('=');

    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signature = value;
    }
  }

  if (!signature) {
    return {
      valid: false,
      error: 'No signature found in Stripe-Signature header',
      errorCode: 'INVALID_FORMAT'
    };
  }

  return verifyWebhookSignature({
    provider: 'stripe',
    secret,
    signature,
    payload,
    timestamp,
    timestampTolerance: 300 // Stripe default
  });
}
