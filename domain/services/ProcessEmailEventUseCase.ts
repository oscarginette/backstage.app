import * as Sentry from '@sentry/nextjs';
import { IEmailEventRepository } from '../repositories/IEmailEventRepository';
import { IEmailEvent } from '../events/IEmailEvent';

export class ProcessEmailEventUseCase {
  constructor(
    private readonly eventRepository: IEmailEventRepository,
    private readonly eventHandlers: Map<string, IEmailEvent>
  ) {}

  async execute(webhookType: string, webhookData: any): Promise<void> {
    // Start Sentry span for webhook processing
    return await Sentry.startSpan(
      {
        op: 'use-case',
        name: 'ProcessEmailEventUseCase',
      },
      async () => {
        try {
          // Add context for debugging
          Sentry.setContext('email_event', {
            webhookType,
            hasEmailId: !!webhookData?.email_id,
            timestamp: new Date().toISOString(),
          });

          Sentry.setTag('webhook_type', webhookType);

          // Extract emailId from webhook data
          const emailId = webhookData?.email_id;

          if (!emailId) {
            const message = 'No email_id in webhook data';
            console.warn(message);

            // Capture as warning in Sentry
            Sentry.captureMessage(message, 'warning');
            Sentry.setContext('missing_email_id', { webhookType, webhookData });

            return;
          }

          // Find email log in database
          const emailLog = await this.eventRepository.findEmailLogByResendId(emailId);

          if (!emailLog) {
            const message = `Email log not found for resend_email_id: ${emailId}`;
            console.warn(message);

            // Capture as warning in Sentry
            Sentry.captureMessage(message, 'warning');
            Sentry.setContext('missing_email_log', { emailId, webhookType });

            return;
          }

          // Get appropriate event handler
          const handler = this.eventHandlers.get(webhookType);

          if (!handler) {
            const message = `Unhandled webhook type: ${webhookType}`;
            console.log(message);

            // Capture as info in Sentry
            Sentry.captureMessage(message, 'info');
            Sentry.setContext('unhandled_webhook', {
              webhookType,
              availableHandlers: Array.from(this.eventHandlers.keys())
            });

            return;
          }

          // Add email log context
          Sentry.setContext('email_log', {
            emailLogId: emailLog.id,
            contactId: emailLog.contact_id,
            trackId: emailLog.track_id,
          });

          // Process event
          await handler.process({
            emailId,
            emailLogId: emailLog.id,
            contactId: emailLog.contact_id,
            trackId: emailLog.track_id,
            data: webhookData
          });
        } catch (error) {
          // Capture error to Sentry
          Sentry.captureException(error, {
            tags: {
              useCase: 'ProcessEmailEvent',
              webhookType,
            },
            extra: {
              webhookData: this.sanitizeWebhookData(webhookData),
            },
          });

          throw error;
        }
      }
    );
  }

  /**
   * Sanitize webhook data to remove PII before sending to Sentry
   */
  private sanitizeWebhookData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    // Remove email addresses and sensitive fields
    if (sanitized.to) sanitized.to = '[Filtered]';
    if (sanitized.from) sanitized.from = '[Filtered]';
    if (sanitized.subject) sanitized.subject = '[Filtered]';
    if (sanitized.html) sanitized.html = '[Filtered]';
    if (sanitized.text) sanitized.text = '[Filtered]';

    return sanitized;
  }
}
