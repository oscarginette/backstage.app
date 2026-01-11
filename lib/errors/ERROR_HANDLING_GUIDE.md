# Error Handling Guide

## Overview

This guide documents the comprehensive error handling system in the Backstage application. All errors follow Clean Architecture principles with SOLID design patterns.

## Architecture

```
lib/errors/
├── error-catalog.ts      # SSOT for all error codes and metadata
├── ERROR_HANDLING_GUIDE.md  # This file
lib/
├── errors.ts             # Error class definitions
├── error-handler.ts      # Error handling middleware
├── api-response.ts       # Response helpers
```

## Error Types

### 1. Authentication Errors (401)

```typescript
import { UnauthorizedError } from '@/lib/errors';

// When authentication is required but missing
throw new UnauthorizedError('Please sign in to continue');

// With details
throw new UnauthorizedError('Invalid credentials', {
  attempted: email
});
```

**Use Cases:**
- Missing or invalid session
- Invalid API key
- Expired JWT token
- Invalid webhook signature

### 2. Authorization Errors (403)

```typescript
import { AccessDeniedError } from '@/lib/errors';

// When user lacks permissions
throw new AccessDeniedError('Admin access required');

// With details
throw new AccessDeniedError('Cannot access this resource', {
  userId: user.id,
  resourceId: campaign.id,
  requiredRole: 'admin'
});
```

**Use Cases:**
- User not admin accessing admin route
- User accessing another user's resource
- Insufficient subscription plan

### 3. Validation Errors (400)

```typescript
import { ValidationError } from '@/lib/errors';

// Single field validation
throw new ValidationError('Email address is required');

// Multiple field validation
throw new ValidationError('Validation failed', {
  fields: {
    email: 'Invalid email format',
    name: 'Name is required'
  }
});
```

**Use Cases:**
- Invalid input format
- Missing required fields
- Data type mismatch
- Business rule violation

### 4. Not Found Errors (404)

```typescript
import { NotFoundError, UserNotFoundError } from '@/lib/errors';

// Generic resource
throw new NotFoundError('Resource not found');

// Specific resource
throw new UserNotFoundError('User not found', { userId: 123 });

// With context
throw new NotFoundError('Campaign not found', {
  campaignId: id,
  userId: user.id
});
```

**Use Cases:**
- Resource doesn't exist
- Invalid ID
- Deleted resource

### 5. Conflict Errors (409)

```typescript
import { ConflictError } from '@/lib/errors';

// Duplicate resource
throw new ConflictError('Email already exists', {
  email: user.email
});

// State conflict
throw new ConflictError('Campaign already sent', {
  campaignId: campaign.id,
  status: campaign.status
});
```

**Use Cases:**
- Duplicate email/username
- Resource already in desired state
- Concurrent modification conflict

### 6. Quota Errors (429)

```typescript
import { QuotaExceededError, EmailQuotaExceededError } from '@/lib/errors';

// Generic quota
throw new QuotaExceededError('Daily email limit reached', {
  limit: quota.dailyLimit,
  current: quota.dailyCount,
  resetsAt: quota.resetDate
});

// Email-specific quota
throw new EmailQuotaExceededError('Monthly email quota exceeded', {
  plan: user.plan,
  limit: 1000,
  used: 1000
});
```

**Use Cases:**
- Daily/monthly email limit
- Contact storage limit
- API rate limit
- File upload size limit

### 7. Database Errors (500/503)

```typescript
import { DatabaseError, DatabaseConnectionError } from '@/lib/errors';

// Connection failure
throw new DatabaseConnectionError('Database unavailable');

// Query failure
throw new DatabaseError('Failed to save data', {
  operation: 'INSERT',
  table: 'contacts'
});
```

**Use Cases:**
- Database connection timeout
- Query execution error
- Transaction rollback
- Constraint violation

**Security:** Database errors are NOT user-friendly. Error handler will return generic message to client.

### 8. External Service Errors (502)

```typescript
import {
  ExternalServiceError,
  EmailProviderError,
  BrevoApiError,
  SoundCloudApiError,
  SpotifyApiError
} from '@/lib/errors';

// Generic external service
throw new ExternalServiceError('External service unavailable');

// Email provider
throw new EmailProviderError('Failed to send email', {
  provider: 'Brevo',
  statusCode: 503
});

// Specific API
throw new SpotifyApiError('Failed to fetch artist', {
  artistId: id,
  statusCode: 500
});
```

**Use Cases:**
- Email provider down (Brevo, Resend)
- Music platform API error (Spotify, SoundCloud)
- Payment gateway error (Stripe)
- Image storage error (Cloudinary)

### 9. Webhook Errors (401)

```typescript
import { WebhookVerificationError } from '@/lib/errors';

// Invalid signature
throw new WebhookVerificationError('Invalid webhook signature', {
  provider: 'Stripe',
  timestamp: Date.now()
});
```

**Use Cases:**
- Stripe webhook signature invalid
- Brevo webhook signature invalid
- Replay attack detected

### 10. Rate Limit Errors (429)

```typescript
import { RateLimitError } from '@/lib/errors';

// API rate limit
throw new RateLimitError('Too many requests', {
  limit: 100,
  windowMs: 60000,
  retryAfter: 30
});
```

**Use Cases:**
- API endpoint rate limiting
- Brute force protection
- DDoS prevention

### 11. Internal Errors (500)

```typescript
import { InternalServerError } from '@/lib/errors';

// Unexpected error
throw new InternalServerError('Configuration error', {
  key: 'BREVO_API_KEY',
  message: 'Missing environment variable'
});
```

**Use Cases:**
- Missing environment variables
- Invalid configuration
- Unexpected application state

**Security:** Internal errors are NOT user-friendly. Error handler will return generic message to client.

## Use Case Pattern

All use cases should throw domain errors (from `@/lib/errors`):

```typescript
// domain/services/CreateCampaignUseCase.ts
import { ValidationError, QuotaExceededError } from '@/lib/errors';

export class CreateCampaignUseCase {
  async execute(input: CreateCampaignInput): Promise<Campaign> {
    // 1. Validate input
    if (!input.name) {
      throw new ValidationError('Campaign name is required');
    }

    // 2. Check quota
    const quota = await this.quotaRepository.getByUserId(input.userId);
    if (!quota.canCreateCampaign()) {
      throw new QuotaExceededError('Campaign limit reached', {
        plan: quota.plan,
        limit: quota.campaignLimit,
        current: quota.campaignCount
      });
    }

    // 3. Create campaign
    const campaign = await this.campaignRepository.create(input);

    return campaign;
  }
}
```

## API Route Pattern

All API routes should use `withErrorHandler` middleware:

```typescript
// app/api/campaigns/route.ts
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse, createdResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';

export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const session = await auth();

  // 1. Authentication check
  if (!session?.user?.id) {
    throw new UnauthorizedError('Please sign in to continue');
  }

  // 2. Parse and validate request
  const body = await request.json();

  // 3. Execute use case
  const useCase = UseCaseFactory.createCreateCampaignUseCase();
  const campaign = await useCase.execute({
    userId: parseInt(session.user.id),
    ...body
  });

  // 4. Return success response
  return createdResponse(
    { campaign: campaign.toJSON() },
    requestId
  );
});
```

**Benefits:**
- Automatic error handling
- Consistent error responses
- Request ID tracking
- Security: Sanitized error messages
- Logging: Full context for debugging

## Error Catalog Integration

All errors are defined in the error catalog with metadata:

```typescript
// lib/errors/error-catalog.ts
export const ERROR_CATALOG = {
  [ERROR_CODES.VALIDATION_ERROR]: {
    code: ERROR_CODES.VALIDATION_ERROR,
    httpStatus: 400,
    messageKey: 'errors.validation.generic',
    category: 'validation',
    severity: 'low',
    userFriendly: true,  // Safe to show to user
    retryable: true,     // User can fix and retry
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    code: ERROR_CODES.DATABASE_ERROR,
    httpStatus: 500,
    messageKey: 'errors.database.generic',
    category: 'database',
    severity: 'critical',
    userFriendly: false, // Hide details from user
    retryable: true,     // Transient error
  },
  // ... more errors
};
```

## Security Best Practices

### 1. User-Friendly vs Internal Errors

```typescript
// ✅ GOOD: User-friendly error (safe to expose)
throw new ValidationError('Email is required');

// ✅ GOOD: Internal error (error handler will sanitize)
throw new DatabaseError('Query failed: SELECT * FROM users WHERE id = 123');
// Client sees: "An internal error occurred. Please try again later."
// Logs contain: Full query, stack trace, details
```

### 2. Error Details

```typescript
// ✅ GOOD: Safe details for user
throw new QuotaExceededError('Email quota exceeded', {
  plan: 'free',
  limit: 1000,
  used: 1000,
  upgradeUrl: '/pricing'
});

// ❌ BAD: Exposing internal details
throw new DatabaseError('Connection failed', {
  host: 'db.internal.com',
  username: 'admin',
  password: 'secret123'
});
```

### 3. Error Messages

```typescript
// ✅ GOOD: Actionable error message
throw new ValidationError('Email address is required');

// ❌ BAD: Technical jargon
throw new ValidationError('Validation constraint violation: NOT NULL on column email');

// ✅ GOOD: User-friendly with context
throw new QuotaExceededError('Daily email limit reached. Quota resets tomorrow at midnight.');

// ❌ BAD: Generic message
throw new Error('Quota exceeded');
```

## Error Response Format

All API errors follow this format:

```json
{
  "error": "Email quota exceeded",
  "code": "QUOTA_EXCEEDED",
  "status": 429,
  "details": {
    "plan": "free",
    "limit": 1000,
    "used": 1000
  },
  "requestId": "req_1704067200000_x7k3m9p2q"
}
```

**Fields:**
- `error`: User-friendly error message (sanitized)
- `code`: Error code for client-side handling
- `status`: HTTP status code
- `details`: Additional context (sanitized, optional)
- `requestId`: Request tracking ID for debugging

## Client-Side Error Handling

```typescript
// Client-side code
try {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();

    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Show validation errors to user
        showValidationErrors(error.details);
        break;

      case 'QUOTA_EXCEEDED':
        // Show upgrade prompt
        showUpgradeModal(error.details);
        break;

      case 'AUTH_REQUIRED':
        // Redirect to login
        router.push('/login');
        break;

      default:
        // Show generic error
        toast.error(error.error);
    }
  }
} catch (error) {
  // Network error
  toast.error('Network error. Please check your connection.');
}
```

## Testing Error Handling

```typescript
// __tests__/use-cases/CreateCampaignUseCase.test.ts
import { CreateCampaignUseCase } from '@/domain/services/CreateCampaignUseCase';
import { ValidationError, QuotaExceededError } from '@/lib/errors';

describe('CreateCampaignUseCase', () => {
  it('should throw ValidationError for missing name', async () => {
    const useCase = new CreateCampaignUseCase(mockRepo);

    await expect(
      useCase.execute({ name: '' })
    ).rejects.toThrow(ValidationError);
  });

  it('should throw QuotaExceededError when limit reached', async () => {
    const useCase = new CreateCampaignUseCase(mockRepo);
    mockRepo.getQuota.mockResolvedValue({ count: 10, limit: 10 });

    await expect(
      useCase.execute({ name: 'Test' })
    ).rejects.toThrow(QuotaExceededError);
  });
});
```

## Migration from Old Errors

If you find old error patterns, update them:

```typescript
// ❌ OLD: Domain-specific error classes
// domain/services/CreateCampaignUseCase.ts
export class ValidationError extends Error { ... }
throw new ValidationError('Name is required');

// ✅ NEW: Centralized error classes
import { ValidationError } from '@/lib/errors';
throw new ValidationError('Name is required');
```

```typescript
// ❌ OLD: Generic catch-all
try {
  await useCase.execute(input);
} catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// ✅ NEW: Error handler middleware
export const POST = withErrorHandler(async (request: Request) => {
  const result = await useCase.execute(input);
  return successResponse(result);
});
```

## Error Codes Reference

See `lib/errors/error-catalog.ts` for complete list of error codes and metadata.

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed (400)
- `AUTH_REQUIRED` - Authentication required (401)
- `FORBIDDEN` - Access denied (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (409)
- `QUOTA_EXCEEDED` - Quota limit reached (429)
- `DATABASE_ERROR` - Database error (500)
- `EXTERNAL_SERVICE_ERROR` - External API error (502)
- `INTERNAL_ERROR` - Internal server error (500)

## Troubleshooting

### Error Not Logged

Check that you're using `withErrorHandler` middleware:

```typescript
// ❌ Missing error handler
export async function POST(request: Request) { ... }

// ✅ With error handler
export const POST = withErrorHandler(async (request: Request) => { ... });
```

### Error Details Exposed

Check error catalog `userFriendly` flag:

```typescript
// lib/errors/error-catalog.ts
[ERROR_CODES.DATABASE_ERROR]: {
  userFriendly: false, // Details will be hidden from client
  ...
}
```

### Request ID Not Included

Generate request ID in API route:

```typescript
import { generateRequestId } from '@/lib/error-handler';

const requestId = generateRequestId();
return successResponse(data, 200, requestId);
```

## References

- Error Catalog: `/lib/errors/error-catalog.ts`
- Error Classes: `/lib/errors.ts`
- Error Handler: `/lib/error-handler.ts`
- API Responses: `/lib/api-response.ts`
- Clean Architecture Guide: `/.claude/CLAUDE.md`
