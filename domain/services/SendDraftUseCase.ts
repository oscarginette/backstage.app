/**
 * SendDraftUseCase
 *
 * Use case for sending a saved draft campaign.
 * Converts draft to sent status and sends to all subscribed contacts.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles draft sending logic
 * - Dependency Inversion: Depends on interfaces, not implementations
 */

import { IContactRepository } from '@/domain/repositories/IContactRepository';
import { IEmailProvider } from '@/infrastructure/email/IEmailProvider';
import { IExecutionLogRepository } from '@/domain/repositories/IExecutionLogRepository';
import { IEmailCampaignRepository } from '@/domain/repositories/IEmailCampaignRepository';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';
import { trackOperation, trackQuery, setUser, addBreadcrumb, captureError } from '@/lib/sentry-utils';

export interface SendDraftInput {
  userId: number;
  draftId: string;
}

export interface SendDraftResult {
  success: boolean;
  campaignId: string;
  emailsSent: number;
  emailsFailed: number;
  totalContacts: number;
  duration: number;
  failures?: Array<{ email: string; error: string }>;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class SendDraftUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private executionLogRepository: IExecutionLogRepository,
    private campaignRepository: IEmailCampaignRepository
  ) {}

  async execute(input: SendDraftInput): Promise<SendDraftResult> {
    setUser({ id: input.userId });

    return trackOperation(
      'SendCampaign',
      async () => {
        const startTime = Date.now();

        try {
          addBreadcrumb('Starting campaign send', {
            draftId: input.draftId,
            userId: input.userId
          });

          // 1. Retrieve draft campaign
          const campaign = await trackQuery(
            'getCampaignById',
            () => this.campaignRepository.findById(input.draftId),
            { draftId: input.draftId }
          );

          if (!campaign) {
            throw new ValidationError(`Draft with ID ${input.draftId} not found`);
          }

          addBreadcrumb('Campaign retrieved', {
            campaignId: campaign.id,
            subject: campaign.subject,
            status: campaign.status
          });

          // 2. Verify it's a draft
          if (campaign.status === 'sent') {
            throw new ValidationError('This campaign has already been sent');
          }

          // 3. Get subscribed contacts
          const contacts = await trackQuery(
            'getSubscribedContacts',
            () => this.contactRepository.getSubscribed(input.userId),
            { userId: input.userId }
          );

          if (contacts.length === 0) {
            throw new ValidationError('No hay contactos suscritos');
          }

          addBreadcrumb('Contacts retrieved', {
            totalContacts: contacts.length
          });

          console.log(`Enviando borrador a ${contacts.length} contactos...`);

          // 4. Send emails
          const results = await this.sendEmails(contacts, campaign);

          addBreadcrumb('Emails sent', {
            emailsSent: results.emailsSent.length,
            emailsFailed: results.emailsFailed.length
          });

          // 5. Mark campaign as sent
          await trackQuery(
            'markCampaignAsSent',
            () => this.campaignRepository.markAsSent(input.draftId),
            { draftId: input.draftId }
          );

          // 6. Log execution
          await this.logExecution(campaign.subject, results.emailsSent.length, input.draftId, startTime);

          // 7. Build response
          return {
            success: true,
            campaignId: input.draftId,
            emailsSent: results.emailsSent.length,
            emailsFailed: results.emailsFailed.length,
            totalContacts: contacts.length,
            duration: Date.now() - startTime,
            failures: results.emailsFailed.length > 0 ? results.emailsFailed : undefined
          };
        } catch (error: unknown) {
          const errorToLog = error instanceof Error ? error : new Error('Unknown error occurred');
          captureError(errorToLog, {
            userId: input.userId,
            action: 'send-campaign',
            metadata: {
              draftId: input.draftId
            }
          });

          await this.logError(errorToLog, startTime);
          throw error;
        }
      },
      {
        draftId: input.draftId,
        userId: input.userId
      }
    );
  }

  private async sendEmails(
    contacts: Array<{ id: number; email: string; name?: string | null; unsubscribeToken: string }>,
    campaign: { id: string; subject: string; htmlContent: string }
  ) {
    return trackOperation(
      'SendEmailBatch',
      async () => {
        const emailsSent: Array<{ email: string; id?: string }> = [];
        const emailsFailed: Array<{ email: string; error: string }> = [];

        const baseUrl = getAppUrl();

        for (const contact of contacts) {
          try {
            // Replace temporary unsubscribe URL with contact-specific one
            const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${contact.unsubscribeToken}`;
            const personalizedHtml = campaign.htmlContent.replace(
              /unsubscribe\?token=TEMP_TOKEN/g,
              `unsubscribe?token=${contact.unsubscribeToken}`
            );

            const result = await trackOperation(
              'SendEmail',
              () => this.emailProvider.send({
                to: contact.email,
                subject: campaign.subject,
                html: personalizedHtml,
                tags: [
                  { name: 'category', value: 'campaign' },
                  { name: 'campaign_id', value: campaign.id }
                ],
                unsubscribeUrl
              }),
              {
                contactId: contact.id,
                email: contact.email,
                campaignId: campaign.id
              }
            );

            if (result.success) {
              emailsSent.push({ email: contact.email, id: result.id });
            } else {
              captureError(new Error(`Email send failed: ${result.error}`), {
                action: 'send-email',
                metadata: {
                  email: contact.email,
                  campaignId: campaign.id,
                  error: result.error
                }
              });
              emailsFailed.push({ email: contact.email, error: result.error || 'Unknown error' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Error procesando ${contact.email}:`, errorMessage);

            captureError(
              error instanceof Error ? error : new Error(errorMessage),
              {
                action: 'send-email-exception',
                metadata: {
                  email: contact.email,
                  campaignId: campaign.id
                }
              }
            );

            emailsFailed.push({ email: contact.email, error: errorMessage });
          }
        }

        return { emailsSent, emailsFailed };
      },
      {
        totalRecipients: contacts.length,
        campaignId: campaign.id,
        subject: campaign.subject
      }
    );
  }

  private async logExecution(
    subject: string,
    emailsSent: number,
    campaignId: string,
    startTime: number
  ): Promise<void> {
    await this.executionLogRepository.create({
      newTracks: 0,
      emailsSent,
      durationMs: Date.now() - startTime,
      trackId: null,
      trackTitle: `Campaign: ${subject}`
    });
  }

  private async logError(error: Error, startTime: number): Promise<void> {
    try {
      await this.executionLogRepository.create({
        error: error.message,
        durationMs: Date.now() - startTime
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}
