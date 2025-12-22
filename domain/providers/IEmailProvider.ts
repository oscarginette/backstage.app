/**
 * IEmailProvider Interface
 *
 * Email provider abstraction for sending emails.
 * Implements Open/Closed Principle - easy to add new providers (Resend, SendGrid, etc).
 *
 * Clean Architecture: Domain layer interface.
 */

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Send an email
   * @param params - Email parameters
   * @returns Result with success status and message ID
   */
  send(params: EmailParams): Promise<EmailResult>;
}
