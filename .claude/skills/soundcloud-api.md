# SoundCloud API Skill

Expert integration with SoundCloud API for fetching user tracks and audio content.

## API Overview

**Base URL**: `https://api.soundcloud.com`
**Authentication**: OAuth 2.1 with PKCE (required)
**Response Format**: JSON
**Rate Limits**:
- Client Credentials: 50 tokens per 12 hours per app
- IP-based: 30 tokens per 1 hour per IP

## Authentication Methods

### 1. Client Credentials Flow (Public Resources Only)
For accessing public tracks, playlists, and user info.

```typescript
// Using Basic Auth (recommended)
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const response = await fetch('https://api.soundcloud.com/oauth2/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'grant_type=client_credentials'
});
```

### 2. Authorization Code Flow (User-Specific Actions)
For uploading tracks, accessing private data, etc. Requires PKCE.

## Key Endpoints

### Get User Tracks
```
GET /users/{user_id}/tracks
```

**Parameters**:
- `limit`: Number of results (default: 50, max: 200)
- `linked_partitioning`: Use pagination (recommended)

**Response**:
```json
{
  "collection": [
    {
      "id": 123456,
      "title": "Track Title",
      "permalink_url": "https://soundcloud.com/user/track",
      "created_at": "2025-01-01T10:00:00Z",
      "artwork_url": "https://...",
      "description": "...",
      "duration": 180000,
      "genre": "Electronic"
    }
  ],
  "next_href": "..."
}
```

### Resolve URL to Resource
```
GET /resolve?url={soundcloud_url}
```

Converts SoundCloud URLs to API resources.

### Search
```
GET /search?q={query}&filter=public
```

**Filters**: tracks, users, playlists, albums

## Current Implementation

The project currently uses **RSS feeds** instead of the API:
```
http://feeds.soundcloud.com/users/soundcloud:users:{USER_ID}/sounds.rss
```

### Why RSS vs API?

**RSS Advantages**:
- ✅ No authentication required
- ✅ Simple XML parsing
- ✅ No rate limiting concerns
- ✅ Works immediately

**API Advantages**:
- ✅ More data fields available
- ✅ Real-time updates
- ✅ Better filtering options
- ✅ Official support

## Migration to API

If you want to migrate from RSS to API:

### Step 1: Register App
1. Go to https://soundcloud.com/you/apps
2. Create new app
3. Get Client ID and Client Secret

### Step 2: Get Access Token
```typescript
async function getSoundCloudToken() {
  const credentials = Buffer.from(
    `${process.env.SOUNDCLOUD_CLIENT_ID}:${process.env.SOUNDCLOUD_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch('https://api.soundcloud.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token; // Expires in ~1 hour
}
```

### Step 3: Fetch User Tracks
```typescript
async function getUserTracks(userId: string, accessToken: string) {
  const response = await fetch(
    `https://api.soundcloud.com/users/${userId}/tracks?limit=1&linked_partitioning=1`,
    {
      headers: {
        'Authorization': `OAuth ${accessToken}`
      }
    }
  );

  const data = await response.json();
  return data.collection[0]; // Latest track
}
```

## Best Practices

1. **Token Management**: Store access tokens with expiry, refresh before expiration
2. **Rate Limiting**: Implement exponential backoff for 429 responses
3. **Error Handling**: Handle 401 (unauthorized), 403 (forbidden), 404 (not found)
4. **Caching**: Cache responses to reduce API calls
5. **Pagination**: Use `next_href` for large result sets

## Environment Variables

```env
SOUNDCLOUD_CLIENT_ID=your_client_id
SOUNDCLOUD_CLIENT_SECRET=your_client_secret
SOUNDCLOUD_USER_ID=1318247880
```

## Common Issues

### Issue: 401 Unauthorized
- **Cause**: Invalid or expired token
- **Solution**: Refresh access token

### Issue: 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Solution**: Implement retry with exponential backoff

### Issue: Missing Tracks
- **Cause**: Private tracks not visible with public access
- **Solution**: Use Authorization Code flow with user permission

## Documentation

- Official API Guide: https://developers.soundcloud.com/docs/api/guide
- Authentication: https://developers.soundcloud.com/docs/api/guide#authentication
- Endpoints: https://developers.soundcloud.com/docs/api/reference

## Current vs API Comparison

| Feature | RSS Feed | API |
|---------|----------|-----|
| Auth | None | OAuth 2.1 |
| Rate Limit | None | 50/12h |
| Data Format | XML | JSON |
| Latest Track | ✅ | ✅ |
| Track Metadata | Limited | Full |
| Real-time | ~15 min delay | Immediate |
| Setup | 0 min | 10 min |

## Recommendation

**Keep RSS for now** unless you need:
- Real-time updates (< 1 min)
- Extended metadata
- Track analytics
- User interaction data

The RSS feed is simpler and sufficient for the current use case (daily checks at 20:00).
