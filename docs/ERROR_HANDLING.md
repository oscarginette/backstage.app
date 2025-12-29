# Centralized Error Handling System

## Overview

This project implements a centralized error handling middleware for consistent API responses across all endpoints. The system provides:

- **Standardized error responses** with proper HTTP status codes
- **Request tracking** via unique request IDs
- **Automatic error logging** for debugging and monitoring
- **Type-safe error classes** that carry semantic meaning
- **Consistent response formats** for both success and error cases

## Architecture

### Core Files

1. **`/lib/errors.ts`** - Centralized error type definitions
2. **`/lib/error-handler.ts`** - Error handling middleware and utilities
3. **`/lib/api-response.ts`** - Standard response formatting functions

## Error Types

All custom errors extend `AppError` which carries:
- `message`: Human-readable error description
- `code`: Machine-readable error code for client-side handling
- `status`: HTTP status code
- `details`: Optional additional error context

### Available Error Classes

```typescript
// 400 - Bad Request
ValidationError('Invalid email format', { field: 'email' })
BadRequestError('Missing required fields')

// 401 - Unauthorized
UnauthorizedError('Authentication required')

// 403 - Forbidden
AccessDeniedError('Insufficient permissions')

// 404 - Not Found
NotFoundError('User not found')

// 409 - Conflict
ConflictError('Email already exists')

// 429 - Too Many Requests
QuotaExceededError('Daily email limit reached')
EmailQuotaExceededError('Email quota exceeded')

// 500 - Internal Server Error
InternalServerError('Database connection failed')
```

## Usage

### Basic API Route with Error Handler

```typescript
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';
import { UnauthorizedError, ValidationError } from '@/lib/errors';

export const GET = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();

  // Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError(); // Automatically returns 401
  }

  // Validate input
  if (!isValidEmail(email)) {
    throw new ValidationError('Invalid email format'); // Returns 400
  }

  // Execute business logic
  const result = await useCase.execute(userId);

  // Return standardized success response
  return successResponse(result, 200, requestId);
});
```

### Error Response Format

All errors return a consistent format:

```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "status": 404,
  "requestId": "req_1704067200000_x7k3m9p2q"
}
```

### Success Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    "userId": 123,
    "email": "user@example.com"
  },
  "requestId": "req_1704067200000_x7k3m9p2q"
}
```

## Response Helpers

### Standard Responses

```typescript
import { successResponse, createdResponse, noContentResponse } from '@/lib/api-response';

// 200 OK
return successResponse({ userId: 123 }, 200, requestId);

// 201 Created
return createdResponse({ userId: 123 }, requestId);

// 204 No Content (for deletes)
return noContentResponse();
```

### Paginated Responses

```typescript
import { paginatedResponse } from '@/lib/api-response';

return paginatedResponse(
  items,      // Array of items
  totalCount, // Total number of items
  page,       // Current page
  limit,      // Items per page
  requestId
);

// Returns:
// {
//   "success": true,
//   "data": {
//     "items": [...],
//     "total": 150,
//     "page": 1,
//     "limit": 20,
//     "totalPages": 8
//   },
//   "requestId": "..."
// }
```

## Request Tracking

Every request gets a unique ID for tracking:

```typescript
const requestId = generateRequestId();
// Format: req_<timestamp>_<random>
// Example: req_1704067200000_x7k3m9p2q
```

Request IDs are:
- Included in all responses (success and error)
- Logged automatically with each request
- Useful for debugging and tracing issues

## Error Handling Best Practices

### 1. Always Use Error Classes

```typescript
// ❌ DON'T: Generic errors lose context
throw new Error('Invalid input');

// ✅ DO: Use specific error classes
throw new ValidationError('Email is required', { field: 'email' });
```

### 2. Let the Middleware Handle Status Codes

```typescript
// ❌ DON'T: Manual status code handling
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// ✅ DO: Throw error, middleware handles status
throw new NotFoundError('User not found');
```

### 3. Include Context in Error Details

```typescript
throw new ValidationError('Validation failed', {
  fields: {
    email: 'Invalid format',
    age: 'Must be over 18'
  }
});
```

### 4. Use Request IDs for Debugging

```typescript
// Error logs include request ID automatically
// Client can reference request ID when reporting issues
console.error(\`[${requestId}] Failed to process payment\`, error);
```

## Migration Guide

### Before (Manual Error Handling)

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await useCase.execute(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### After (Centralized Error Handling)

```typescript
import { withErrorHandler, generateRequestId } from '@/lib/error-handler';
import { successResponse } from '@/lib/api-response';

export const POST = withErrorHandler(async (request: Request) => {
  const requestId = generateRequestId();
  const body = await request.json();
  const result = await useCase.execute(body);
  return successResponse(result, 200, requestId);
});
```

## Benefits

1. **Consistency**: All API responses follow the same format
2. **Type Safety**: Error classes provide compile-time guarantees
3. **Debugging**: Request IDs make it easy to trace issues
4. **Maintainability**: Error handling logic in one place
5. **Client-Friendly**: Machine-readable error codes enable better UX
6. **Automatic Logging**: Unexpected errors are logged automatically
7. **SOLID Compliance**: Separation of concerns between routes and error handling

## Testing

Error handling is automatically tested through the middleware:

```typescript
describe('Error Handler', () => {
  it('should return 404 for NotFoundError', async () => {
    const handler = withErrorHandler(async () => {
      throw new NotFoundError('User not found');
    });

    const response = await handler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('User not found');
    expect(data.code).toBe('NOT_FOUND');
    expect(data.requestId).toBeDefined();
  });
});
```

## Monitoring Integration

Request IDs can be integrated with monitoring tools:

```typescript
// Example: Send to error tracking service
export function logRequest(method: string, url: string, requestId: string) {
  console.log(\`[${requestId}] ${method} ${url}\`);

  // Optional: Send to monitoring service
  // Sentry.setContext('request', { requestId, method, url });
}
```

## Future Enhancements

- [ ] Add error rate limiting per endpoint
- [ ] Implement retry logic for transient errors
- [ ] Add Sentry/monitoring service integration
- [ ] Create error metrics dashboard
- [ ] Add error categorization (client vs server errors)
- [ ] Implement circuit breaker pattern for external services

---

*Last Updated: 2025-12-29*
*Clean Architecture Compliant: Yes*
*SOLID Principles: Yes*
