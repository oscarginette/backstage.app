# Brevo API Skill

Expert integration with Brevo (formerly Sendinblue) API for transactional emails and contact management.

## API Overview

**Base URL**: `https://api.brevo.com/v3`
**Authentication**: API Key (header: `api-key`)
**Response Format**: JSON
**SDK**: `@getbrevo/brevo` (official Node.js SDK)
**Rate Limits**: Varies by plan (check response headers)

## Authentication

### API Key Types

1. **Standard API Key**: Full access to all endpoints
   - Contacts: Read/Write
   - Transactional Emails: Send
   - Lists: Manage
   - Templates: Access

2. **MCP API Key**: Limited to MCP protocol (NOT for REST API)
   - ❌ Cannot access Contacts API
   - ❌ Cannot manage lists
   - ⚠️ Only for Model Context Protocol integrations

### Getting API Key

1. Go to https://app.brevo.com/settings/keys/api
2. Click "Create a new API key" (NOT "MCP Server API key")
3. Name: "SoundCloud Automation"
4. Permissions:
   - ✅ **Contacts** → Read
   - ✅ **Lists** → Read
   - ✅ **Email Campaigns** → Read/Send
   - ✅ **Transactional Emails** → Send

### Using API Key

```typescript
import * as brevo from '@getbrevo/brevo';

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);
```

## Key Endpoints

### 1. Send Transactional Email

```typescript
POST /smtp/email
```

**With Template:**
```typescript
const sendSmtpEmail = new brevo.SendSmtpEmail();
sendSmtpEmail.sender = { email: "info@geebeat.com", name: "Gee Beat" };
sendSmtpEmail.to = [{ email: "user@example.com", name: "User" }];
sendSmtpEmail.templateId = 3;
sendSmtpEmail.params = {
  TRACK_NAME: "New Song",
  TRACK_URL: "https://soundcloud.com/...",
  COVER_IMAGE: "https://..."
};

await apiInstance.sendTransacEmail(sendSmtpEmail);
```

**Response:**
```json
{
  "messageId": "<202501210000.12345@smtp-relay.mailin.fr>"
}
```

### 2. Send to Contact Lists

**Method 1: Email Campaigns (Batch)**
Not recommended for transactional emails.

**Method 2: Transactional with List IDs**
```typescript
sendSmtpEmail.to = [{
  email: "", // Required but can be empty
  listId: 2  // Send to all contacts in list 2
}];
```

**Method 3: messageVersions (Multiple Lists)**
```typescript
sendSmtpEmail.messageVersions = [
  { to: [{ email: "", listId: 2 }] },
  { to: [{ email: "", listId: 3 }] }
];
```

### 3. Get Contact Lists

```typescript
GET /contacts/lists
```

```typescript
const apiInstance = new brevo.ContactsApi();
apiInstance.setApiKey(
  brevo.ContactsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const response = await apiInstance.getLists();
const lists = response.body.lists.map(list => ({
  id: list.id,
  name: list.name,
  totalSubscribers: list.totalSubscribers
}));
```

**Response:**
```json
{
  "lists": [
    {
      "id": 2,
      "name": "Newsletter Subscribers",
      "totalSubscribers": 150
    },
    {
      "id": 3,
      "name": "VIP Fans",
      "totalSubscribers": 50
    }
  ]
}
```

### 4. Get Transactional Email Logs

```typescript
GET /smtp/emails
```

**Parameters**:
- `limit`: Max 500
- `offset`: For pagination
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `messageId`: Specific email

## Templates

### Creating a Template

1. Go to https://app.brevo.com/templates/email
2. Click "Create a new template"
3. Choose "Transactional"
4. Design HTML or use drag-and-drop

### Template Variables

Use double curly braces:
```html
<h1>{{ params.TRACK_NAME }}</h1>
<img src="{{ params.COVER_IMAGE }}" />
<a href="{{ params.TRACK_URL }}">Listen Now</a>
```

### Getting Template ID

- From URL: `...templates/email/edit/3` → ID is `3`
- From API: `GET /smtp/templates`

## Current Implementation

### Configuration

```env
BREVO_API_KEY=xkeysib-...
BREVO_TEMPLATE_ID=3
SENDER_EMAIL=info@geebeat.com
```

### Sending to Lists

```typescript
// Current approach in check-soundcloud route
const configResult = await sql`
  SELECT brevo_list_ids FROM app_config WHERE id = 1
`;

const listIds = configResult.rows[0].brevo_list_ids; // [2, 3]

sendSmtpEmail.messageVersions = listIds.map((listId) => ({
  to: [{
    email: '',
    listId: listId
  }]
}));
```

## Rate Limits

### Understanding Limits

Check response headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Handling Rate Limits

```typescript
try {
  await apiInstance.sendTransacEmail(sendSmtpEmail);
} catch (error) {
  if (error.response?.statusCode === 429) {
    const resetTime = error.response.headers['x-ratelimit-reset'];
    // Wait until reset time
    await sleep(resetTime - Date.now());
    // Retry
  }
}
```

## Best Practices

### 1. Verify Sender Email

Before sending:
1. Go to https://app.brevo.com/settings/senders
2. Add `info@geebeat.com`
3. Verify via DNS records or email confirmation

### 2. Use Templates

✅ **DO**: Use templates for consistent branding
❌ **DON'T**: Send HTML directly in API calls

### 3. Monitor Deliverability

Check https://app.brevo.com/logs/transactional for:
- Delivery status
- Opens/clicks
- Bounces
- Spam complaints

### 4. Handle Errors Gracefully

```typescript
try {
  const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Email sent:', response.body.messageId);
} catch (error) {
  if (error.response?.statusCode === 400) {
    console.error('Invalid request:', error.response.body);
  } else if (error.response?.statusCode === 401) {
    console.error('Invalid API key');
  } else if (error.response?.statusCode === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Unknown error:', error.message);
  }
  throw error;
}
```

### 5. Test with Sandbox Mode

```typescript
sendSmtpEmail.headers = {
  'X-Brevo-Sandbox': '1' // Emails won't actually send
};
```

## Batch Sending

Send up to 1000 personalized emails in one request:

```typescript
sendSmtpEmail.messageVersions = [
  {
    to: [{ email: "user1@example.com" }],
    params: { TRACK_NAME: "Song 1" }
  },
  {
    to: [{ email: "user2@example.com" }],
    params: { TRACK_NAME: "Song 2" }
  }
  // ... up to 1000
];
```

## Common Issues

### Issue: 401 Unauthorized
**Cause**: Invalid API key or wrong API key type (MCP instead of standard)
**Solution**: Create new standard API key at https://app.brevo.com/settings/keys/api

### Issue: 403 Forbidden
**Cause**: API key doesn't have required permissions
**Solution**: Regenerate API key with correct permissions (Contacts: Read, SMTP: Send)

### Issue: 400 Bad Request
**Cause**: Invalid email format, missing required fields, or invalid template params
**Solution**: Validate all fields before sending

### Issue: Template Not Found
**Cause**: Wrong template ID or template deleted
**Solution**: Verify template ID at https://app.brevo.com/templates/email

## Monitoring & Analytics

### Real-time Tracking

```typescript
// Get email status
GET /smtp/emails/{messageId}
```

### Webhook Events

Configure webhooks at https://app.brevo.com/settings/webhooks for:
- `delivered`
- `opened`
- `clicked`
- `hard_bounce`
- `soft_bounce`
- `spam`
- `unsubscribe`

## API vs SDK

### Using REST API Directly

```bash
curl -X POST "https://api.brevo.com/v3/smtp/email" \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {"email": "info@geebeat.com"},
    "to": [{"email": "user@example.com"}],
    "templateId": 3,
    "params": {"TRACK_NAME": "New Song"}
  }'
```

### Using SDK (Recommended)

✅ Type-safe
✅ Handles auth automatically
✅ Better error messages
✅ Auto-retry logic

## Documentation Links

- Official Docs: https://developers.brevo.com
- Send Transactional Email: https://developers.brevo.com/docs/send-a-transactional-email
- Batch Send: https://developers.brevo.com/docs/batch-send-transactional-emails
- API Reference: https://developers.brevo.com/reference/sendtransacemail
- Get Lists: https://developers.brevo.com/reference/getlists
- Node.js SDK: https://github.com/getbrevo/brevo-node

## Environment Variables

```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-... # Standard API key (NOT MCP)
BREVO_TEMPLATE_ID=3
SENDER_EMAIL=info@geebeat.com # Must be verified in Brevo
```

## Migration Notes

If migrating from another email service:
1. Export contacts to CSV
2. Import to Brevo: https://app.brevo.com/contact/import
3. Create lists and segments
4. Recreate email templates
5. Update sender domains and verify

---

**Last Updated**: 2025-01-21 (Based on current Brevo API v3 documentation)
