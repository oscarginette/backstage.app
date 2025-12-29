/**
 * Webhook Utilities
 *
 * Exports webhook signature verification and related utilities.
 *
 * Infrastructure layer - handles webhook security concerns.
 */

export {
  verifyWebhookSignature,
  verifyResendWebhook,
  verifyStripeWebhook,
  parseResendSignature,
  type WebhookVerificationConfig,
  type VerificationResult
} from './verify-signature';
