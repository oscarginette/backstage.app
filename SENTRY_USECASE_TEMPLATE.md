# Sentry Use Case Integration Template

## Basic Pattern

```typescript
import { trackOperation, setUser, addBreadcrumb, captureError } from '@/lib/sentry-utils';

export class YourUseCase {
  async execute(input: YourInput): Promise<YourResult> {
    return trackOperation(
      'OperationName', // Nombre descriptivo para Sentry dashboard
      async () => {
        // 1. Set user context (opcional)
        if (input.userId) {
          setUser({ id: input.userId });
        }

        // 2. Add breadcrumbs para debugging
        addBreadcrumb('Starting operation', {
          inputData: input
        });

        // 3. Tu lógica de negocio
        const step1Result = await this.doStep1();

        addBreadcrumb('Step 1 completed', {
          result: step1Result
        });

        const step2Result = await this.doStep2();

        // 4. Return result
        return { success: true, data: step2Result };
      },
      // 5. Metadata para Sentry (opcional)
      {
        userId: input.userId,
        operationType: 'batch',
        itemCount: input.items?.length
      }
    );
  }
}
```

## For External API Calls

```typescript
import { trackApiCall } from '@/lib/sentry-utils';

async fetchFromExternalApi(userId: string) {
  return trackApiCall(
    'serviceName',     // e.g., 'soundcloud', 'stripe', 'resend'
    'operationName',   // e.g., 'getTracks', 'createCharge', 'sendEmail'
    async () => {
      const response = await fetch('https://api.example.com/...');
      return response.json();
    },
    { userId }  // Metadata
  );
}
```

## For Database Queries

```typescript
import { trackQuery } from '@/lib/sentry-utils';

async findExpensiveData(userId: number) {
  return trackQuery(
    'Campaign.findWithStats',  // Query name
    async () => {
      return sql`
        SELECT c.*, COUNT(s.id) as submission_count
        FROM campaigns c
        LEFT JOIN submissions s ON s.campaign_id = c.id
        WHERE c.user_id = ${userId}
        GROUP BY c.id
      `;
    },
    { userId }  // Metadata
  );
}
```

## Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    userId: input.userId,
    action: 'send-email',
    metadata: {
      campaignId: campaign.id,
      recipientEmail: contact.email,
    }
  });

  // Re-throw or handle
  throw error;
}
```

## When to Use Each Function

### trackOperation()
- ✅ Use Cases (business logic)
- ✅ Complex multi-step operations
- ✅ Critical business flows

### trackApiCall()
- ✅ External API calls (SoundCloud, Stripe, Resend)
- ✅ Webhook processing
- ✅ Third-party integrations

### trackQuery()
- ✅ Expensive database queries
- ✅ Queries with JOINs
- ✅ Aggregations and analytics queries

### captureError()
- ✅ Expected errors you want to track
- ✅ Errors with additional context
- ✅ Non-blocking errors (log and continue)

### addBreadcrumb()
- ✅ Important steps in operation
- ✅ State changes
- ✅ Decision points

### setUser()
- ✅ At the start of authenticated operations
- ✅ In API route handlers
- ✅ After login/authentication

## Example: Complete Use Case

```typescript
import {
  trackOperation,
  trackApiCall,
  trackQuery,
  setUser,
  addBreadcrumb,
  captureError,
  logWarning
} from '@/lib/sentry-utils';

export class SendCampaignUseCase {
  constructor(
    private campaignRepo: ICampaignRepository,
    private contactRepo: IContactRepository,
    private emailProvider: IEmailProvider
  ) {}

  async execute(input: SendCampaignInput): Promise<SendCampaignResult> {
    return trackOperation(
      'SendCampaign',
      async () => {
        // Set user context
        setUser({ id: input.userId });

        // Step 1: Load campaign
        addBreadcrumb('Loading campaign', { campaignId: input.campaignId });

        const campaign = await trackQuery(
          'Campaign.findById',
          () => this.campaignRepo.findById(input.campaignId),
          { campaignId: input.campaignId }
        );

        if (!campaign) {
          throw new NotFoundError('Campaign not found');
        }

        // Step 2: Load contacts
        addBreadcrumb('Loading contacts', { userId: input.userId });

        const contacts = await trackQuery(
          'Contact.getSubscribed',
          () => this.contactRepo.getSubscribed(input.userId),
          { userId: input.userId }
        );

        if (contacts.length === 0) {
          logWarning('No contacts to send campaign', {
            campaignId: campaign.id,
            userId: input.userId
          });
          return { success: true, sent: 0 };
        }

        addBreadcrumb('Contacts loaded', { count: contacts.length });

        // Step 3: Send emails
        let sentCount = 0;
        let errorCount = 0;

        for (const contact of contacts) {
          try {
            await trackApiCall(
              'resend',
              'sendEmail',
              async () => {
                return this.emailProvider.send({
                  to: contact.email,
                  subject: campaign.subject,
                  html: campaign.htmlContent,
                });
              },
              { contactId: contact.id }
            );

            sentCount++;
          } catch (error) {
            errorCount++;

            captureError(error as Error, {
              userId: input.userId,
              action: 'send-campaign-email',
              metadata: {
                campaignId: campaign.id,
                contactId: contact.id,
                contactEmail: contact.email,
              }
            });

            // Continue with other contacts
          }
        }

        addBreadcrumb('Campaign sent', {
          sent: sentCount,
          errors: errorCount
        });

        return {
          success: true,
          sent: sentCount,
          errors: errorCount
        };
      },
      {
        campaignId: input.campaignId,
        userId: input.userId,
      }
    );
  }
}
```

## Benefits

With this pattern, Sentry will show you:

1. **Performance**: How long each operation took
2. **Errors**: Exactly where it failed
3. **Context**: User ID, campaign ID, etc.
4. **Breadcrumbs**: Step-by-step what happened
5. **User Impact**: Which users are affected
6. **API Health**: Which external APIs are slow/failing

## Alerts to Set Up

1. **Error rate** > 5% in 5 minutes → Email/Slack
2. **SendCampaign** operation > 30 seconds → Warning
3. **External API** call > 5 seconds → Warning
4. **Database query** > 1 second → Warning
5. **Any unhandled exception** → Critical alert
