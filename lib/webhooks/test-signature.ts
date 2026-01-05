/**
 * Webhook Signature Testing Script
 *
 * Generates valid webhook signatures for local testing and development.
 * Helps verify that signature verification is working correctly.
 *
 * Usage:
 * ```bash
 * # Generate a test signature
 * npx tsx lib/webhooks/test-signature.ts
 *
 * # Test with custom payload
 * npx tsx lib/webhooks/test-signature.ts '{"type":"email.sent","data":{...}}'
 * ```
 */

import * as crypto from 'crypto';

/**
 * Configuration for test signature generation
 */
interface TestSignatureConfig {
  /** Provider to generate signature for */
  provider: 'resend' | 'stripe';

  /** Webhook payload (will be stringified if object) */
  payload: string | object;

  /** Webhook secret (default: example secret) */
  secret?: string;

  /** Include timestamp in signature (recommended) */
  includeTimestamp?: boolean;
}

/**
 * Generates a valid webhook signature for testing
 */
function generateTestSignature(config: TestSignatureConfig): {
  payload: string;
  signature: string;
  timestamp?: string;
  signatureHeader: string;
  curlCommand: string;
} {
  const {
    provider,
    payload,
    secret = 'whsec_test_secret_for_local_development_only',
    includeTimestamp = true
  } = config;

  // Convert payload to string if object
  const payloadString = typeof payload === 'object'
    ? JSON.stringify(payload)
    : payload;

  // Generate timestamp (Unix timestamp in seconds)
  const timestamp = includeTimestamp
    ? Math.floor(Date.now() / 1000).toString()
    : undefined;

  // Create signed payload (timestamp.payload or just payload)
  const signedPayload = timestamp
    ? `${timestamp}.${payloadString}`
    : payloadString;

  // Compute HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload, 'utf-8');
  const signature = hmac.digest('hex');

  // Format signature header based on provider
  const signatureHeader = formatSignatureHeader(provider, signature, timestamp);

  // Generate curl command for testing
  const curlCommand = generateCurlCommand(
    provider,
    payloadString,
    signatureHeader
  );

  return {
    payload: payloadString,
    signature,
    timestamp,
    signatureHeader,
    curlCommand
  };
}

/**
 * Formats signature header according to provider spec
 */
function formatSignatureHeader(
  provider: 'resend' | 'stripe',
  signature: string,
  timestamp?: string
): string {
  if (provider === 'resend') {
    // Resend format: "t=timestamp,v1=signature"
    return timestamp
      ? `t=${timestamp},v1=${signature}`
      : `v1=${signature}`;
  } else {
    // Stripe format: "t=timestamp,v1=signature"
    return timestamp
      ? `t=${timestamp},v1=${signature}`
      : `v1=${signature}`;
  }
}

/**
 * Generates curl command for testing webhook endpoint
 */
function generateCurlCommand(
  provider: 'resend' | 'stripe',
  payload: string,
  signatureHeader: string
): string {
  const headerName = provider === 'resend'
    ? 'Resend-Signature'
    : 'Stripe-Signature';

  const endpoint = provider === 'resend'
    ? '/api/webhooks/resend'
    : '/api/webhooks/stripe';

  const baseUrl = 'http://localhost:3002'; // Local development

  return `curl -X POST ${baseUrl}${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "${headerName}: ${signatureHeader}" \\
  -d '${payload.replace(/'/g, "'\\''")}'`;
}

/**
 * Example Resend webhook payloads
 */
const EXAMPLE_RESEND_PAYLOADS = {
  'email.sent': {
    type: 'email.sent',
    created_at: new Date().toISOString(),
    data: {
      created_at: new Date().toISOString(),
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@thebackstage.app',
      to: ['user@example.com'],
      subject: 'Test Email'
    }
  },
  'email.delivered': {
    type: 'email.delivered',
    created_at: new Date().toISOString(),
    data: {
      created_at: new Date().toISOString(),
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@thebackstage.app',
      to: ['user@example.com'],
      subject: 'Test Email'
    }
  },
  'email.bounced': {
    type: 'email.bounced',
    created_at: new Date().toISOString(),
    data: {
      created_at: new Date().toISOString(),
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@thebackstage.app',
      to: ['bounced@example.com'],
      subject: 'Test Email',
      bounce_type: 'hard'
    }
  },
  'email.opened': {
    type: 'email.opened',
    created_at: new Date().toISOString(),
    data: {
      created_at: new Date().toISOString(),
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@thebackstage.app',
      to: 'user@example.com',
      subject: 'Test Email'
    }
  },
  'email.clicked': {
    type: 'email.clicked',
    created_at: new Date().toISOString(),
    data: {
      created_at: new Date().toISOString(),
      email_id: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
      from: 'noreply@thebackstage.app',
      to: 'user@example.com',
      subject: 'Test Email',
      click: {
        link: 'https://example.com',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      }
    }
  }
};

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);

  // Get provider from args or default to resend
  const provider: 'resend' | 'stripe' = (args[0] === 'stripe' || args[0] === 'resend')
    ? args[0]
    : 'resend';

  // Get payload from args or use example
  let payload: string | object;

  if (args.length > 0 && args[0] !== 'resend' && args[0] !== 'stripe') {
    // Custom payload provided
    payload = args[0];
  } else if (args.length > 1) {
    // Provider specified, payload in second arg
    payload = args[1];
  } else {
    // Use example payload
    if (provider === 'resend') {
      payload = EXAMPLE_RESEND_PAYLOADS['email.sent'];
    } else {
      payload = {
        id: 'evt_test_webhook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test_123' } }
      };
    }
  }

  // Get secret from environment or use test secret
  const secret = provider === 'resend'
    ? process.env.RESEND_WEBHOOK_SECRET || 'whsec_test_secret_for_local_development_only'
    : process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_for_local_development_only';

  // Generate signature
  const result = generateTestSignature({
    provider,
    payload,
    secret,
    includeTimestamp: true
  });

  // Output results
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║              Webhook Signature Test Generator                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`Provider: ${provider.toUpperCase()}\n`);

  console.log('📦 Payload:');
  console.log(result.payload);
  console.log();

  if (result.timestamp) {
    console.log(`⏰ Timestamp: ${result.timestamp} (${new Date(parseInt(result.timestamp) * 1000).toISOString()})`);
    console.log();
  }

  console.log('🔐 Signature:');
  console.log(result.signature);
  console.log();

  console.log('📋 Signature Header:');
  const headerName = provider === 'resend' ? 'Resend-Signature' : 'Stripe-Signature';
  console.log(`${headerName}: ${result.signatureHeader}`);
  console.log();

  console.log('🧪 Test with cURL:');
  console.log(result.curlCommand);
  console.log();

  console.log('💡 Tips:');
  console.log('  - Make sure your local server is running on http://localhost:3002');
  console.log(`  - Set ${provider.toUpperCase()}_WEBHOOK_SECRET in your .env.local file`);
  console.log('  - The signature is only valid for ~5 minutes (timestamp validation)');
  console.log();

  console.log('📚 More examples:');
  if (provider === 'resend') {
    console.log('  npx tsx lib/webhooks/test-signature.ts resend \'{"type":"email.bounced",...}\'');
  } else {
    console.log('  npx tsx lib/webhooks/test-signature.ts stripe \'{"type":"payment_intent.succeeded",...}\'');
  }
  console.log();
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for programmatic use
export { generateTestSignature, EXAMPLE_RESEND_PAYLOADS };
