# Sentry Usage Examples

## 1. En Repositorios (Database Layer)

```typescript
import { trackQuery, captureError } from '@/lib/sentry-utils';

export class PostgresEmailCampaignRepository {
  async findAll(options?: FindCampaignsOptions): Promise<EmailCampaign[]> {
    return trackQuery(
      'EmailCampaign.findAll',
      async () => {
        // Tu query aquí
        const result = await sql`SELECT * FROM email_campaigns...`;
        return result.rows.map(row => EmailCampaign.fromDatabase(row));
      },
      { filters: options } // Metadata opcional
    );
  }
}
```

## 2. En Use Cases (Business Logic)

```typescript
import { trackOperation, setUser, addBreadcrumb } from '@/lib/sentry-utils';

export class SendCampaignUseCase {
  async execute(input: SendCampaignInput): Promise<Result> {
    return trackOperation(
      'SendCampaign',
      async () => {
        // Set user context
        setUser({ id: input.userId });
        
        // Add breadcrumbs
        addBreadcrumb('Starting campaign send', { campaignId: input.campaignId });
        
        const campaign = await this.campaignRepo.findById(input.campaignId);
        const contacts = await this.contactRepo.getSubscribed(input.userId);
        
        addBreadcrumb('Loaded campaign data', { 
          campaignId: campaign.id, 
          recipientCount: contacts.length 
        });
        
        // Send emails...
        
        return { success: true };
      },
      { campaignId: input.campaignId, userId: input.userId }
    );
  }
}
```

## 3. En API Routes

```typescript
import { captureError, setUser } from '@/lib/sentry-utils';
import { withErrorHandler } from '@/lib/error-handler';

export const POST = withErrorHandler(async (request: Request) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Set user context in Sentry
    setUser({ id: parseInt(session.user.id), email: session.user.email });
    
    const useCase = new SendCampaignUseCase(campaignRepo, emailProvider);
    const result = await useCase.execute({ userId: parseInt(session.user.id) });
    
    return NextResponse.json(result);
  } catch (error) {
    // Error is already captured by trackOperation
    // But you can add more context if needed
    captureError(error as Error, {
      userId: session?.user?.id ? parseInt(session.user.id) : undefined,
      action: 'send-campaign',
    });
    throw error;
  }
});
```

## 4. En External API Calls

```typescript
import { trackApiCall } from '@/lib/sentry-utils';

export class SoundCloudClient {
  async fetchTracks(userId: string): Promise<Track[]> {
    return trackApiCall(
      'soundcloud',
      'fetchTracks',
      async () => {
        const response = await fetch(`https://api.soundcloud.com/users/${userId}/tracks`);
        return response.json();
      },
      { userId } // Metadata
    );
  }
}
```

## 5. Custom Error Tracking

```typescript
import { logWarning, logInfo, captureError } from '@/lib/sentry-utils';

// Info level
logInfo('Campaign sent successfully', {
  campaignId: 123,
  recipients: 50,
  sentAt: new Date(),
});

// Warning level
logWarning('SoundCloud API rate limit approaching', {
  remaining: 10,
  resetAt: new Date(),
});

// Error with context
try {
  await sendEmail(contact);
} catch (error) {
  captureError(error as Error, {
    userId: contact.userId,
    action: 'send-email',
    metadata: {
      contactId: contact.id,
      email: contact.email,
    },
  });
}
```

## 6. Benefits

### Performance Monitoring
- ✅ Track slow database queries automatically
- ✅ Monitor API call latency
- ✅ Identify bottlenecks in business logic

### Error Context
- ✅ Full stack traces with source maps
- ✅ User context (who experienced the error)
- ✅ Breadcrumbs (what led to the error)
- ✅ Custom metadata (campaign IDs, etc.)

### Privacy & GDPR
- ✅ Automatic PII filtering (email, password)
- ✅ Header sanitization (authorization, cookies)
- ✅ No events in development mode

## 7. Viewing in Sentry Dashboard

1. Go to: https://sentry.io/organizations/oscarginette/projects/backstage/
2. **Issues** tab: See all errors grouped by type
3. **Performance** tab: See slow operations
4. **Replays** tab: Watch user sessions when errors occur

## 8. Alerts (Recommended)

Set up alerts in Sentry for:
- ❌ Any unhandled exception
- ⚠️ Error rate > 5% in 5 minutes
- 🐌 P95 response time > 1 second
- 📊 Database query time > 500ms
