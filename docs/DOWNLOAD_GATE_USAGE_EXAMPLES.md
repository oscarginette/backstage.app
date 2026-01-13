# Download Gate Multi-Brand Consent - Usage Examples

This document provides practical examples of how to integrate and use the download gate system.

---

## 📋 Quick Start

### 1. Display Download Gate Form (The Backstage)

```tsx
// app/gate/[slug]/page.tsx
import { DownloadGateForm } from './DownloadGateForm';

export default function GatePage({ params }: { params: { slug: string } }) {
  return (
    <div>
      <h1>Download Free Track</h1>
      <DownloadGateForm
        artistName="DJ Example"
        trackTitle="Summer Vibes 2026"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

async function handleSubmit(data: DownloadGateFormData) {
  const response = await fetch(`/api/gate/${slug}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
```

### 2. Display Download Gate Form (Gee Beat)

Same component, different source:

```tsx
// app/gate/[slug]/page.tsx (Gee Beat version)
import { DownloadGateForm } from '@thebackstage/download-gate-form'; // Shared component

export default function GatePageGee Beat({ params }: { params: { slug: string } }) {
  return (
    <DownloadGateForm
      artistName="Producer X"
      trackTitle="Underground Beats"
      source="gee_beat" // ← Key difference!
      onSubmit={handleSubmit}
    />
  );
}
```

---

## 🔌 API Integration Examples

### Submit Download Gate Form

```typescript
// Example: Submit form from The Backstage
const response = await fetch('/api/gate/summer-vibes-2026/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'fan@example.com',
    firstName: 'John',
    consentBackstage: true,  // User accepted Backstage emails
    consentGee Beat: false,       // User declined Gee Beat emails
    source: 'the_backstage',  // Submission from Backstage
  }),
});

const result = await response.json();

if (response.ok) {
  console.log('Success:', result);
  // {
  //   success: true,
  //   submissionId: "abc-123-def-456",
  //   requiresVerification: true,
  //   verificationsSent: {
  //     email: true,
  //     soundcloudRepost: true,
  //     soundcloudFollow: false,
  //     spotifyConnect: false,
  //     instagramFollow: false
  //   }
  // }
} else {
  console.error('Error:', result.error);
  // Handle errors:
  // - 404: Gate not found
  // - 403: Gate inactive/expired
  // - 409: Duplicate submission
  // - 400: Validation error
}
```

### Validate and Download File

```typescript
// Example: User clicks download link
// Link format: https://thebackstage.app/api/download/abc123def456

// Browser automatically handles redirect
window.location.href = '/api/download/abc123def456';

// Or programmatically:
const response = await fetch('/api/download/abc123def456');

if (response.redirected) {
  // User gets redirected to file URL
  window.location.href = response.url;
} else if (response.status === 410) {
  alert('Download link expired. Please request a new one.');
} else if (response.status === 409) {
  alert('This link was already used.');
} else if (response.status === 404) {
  alert('Invalid download link.');
}
```

---

## 🎨 Custom Form Examples

### Minimal Form (No Optional Fields)

```tsx
'use client';

import { useState } from 'react';
import { DOWNLOAD_SOURCES } from '@/domain/types/download-gate-constants';

export function MinimalDownloadForm({ artistName }: { artistName: string }) {
  const [email, setEmail] = useState('');
  const [consentBackstage, setConsentBackstage] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/gate/my-track/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          consentBackstage,
          consentGee Beat: false, // Not offering Gee Beat consent
          source: DOWNLOAD_SOURCES.THE_BACKSTAGE,
        }),
      });

      if (response.ok) {
        alert('Check your email for download link!');
      } else {
        alert('Error submitting form');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
      />

      <label>
        <input
          type="checkbox"
          checked={consentBackstage}
          onChange={(e) => setConsentBackstage(e.target.checked)}
          required
        />
        I accept emails from The Backstage
      </label>

      <p className="text-xs text-gray-600">
        Artist consent ({artistName}) is automatic (required to download)
      </p>

      <button type="submit" disabled={loading || !email || !consentBackstage}>
        {loading ? 'Submitting...' : 'Download Track'}
      </button>
    </form>
  );
}
```

### Advanced Form (All Options)

```tsx
'use client';

import { useState } from 'react';
import { DOWNLOAD_SOURCES } from '@/domain/types/download-gate-constants';

interface FormData {
  email: string;
  firstName: string;
  consentBackstage: boolean;
  consentGee Beat: boolean;
  consentArtist: boolean; // Always true
}

export function AdvancedDownloadForm({
  artistName,
  trackTitle,
  source = 'the_backstage',
}: {
  artistName: string;
  trackTitle: string;
  source?: 'the_backstage' | 'gee_beat';
}) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    consentBackstage: false,
    consentGee Beat: false,
    consentArtist: true, // Always true
  });

  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isValid =
    formData.email.includes('@') &&
    (formData.consentBackstage || formData.consentGee Beat);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('loading');

    try {
      const response = await fetch('/api/gate/my-track/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName || undefined,
          consentBackstage: formData.consentBackstage,
          consentGee Beat: formData.consentGee Beat,
          source: source === 'gee_beat' ? DOWNLOAD_SOURCES.GBID : DOWNLOAD_SOURCES.THE_BACKSTAGE,
        }),
      });

      if (response.ok) {
        setState('success');
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Submission failed');
        setState('error');
      }
    } catch (error) {
      setErrorMessage('Network error');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <h3 className="text-2xl font-bold text-green-600 mb-4">Success!</h3>
        <p>Check your email for verification instructions.</p>
        <p className="text-sm text-gray-600 mt-2">
          Track: <strong>{trackTitle}</strong> by {artistName}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {errorMessage}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      {/* First Name */}
      <div>
        <label htmlFor="firstName" className="block font-medium mb-1">
          First Name (optional)
        </label>
        <input
          type="text"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Consent Checkboxes */}
      <div className="space-y-2 border-t pt-4">
        <p className="font-medium mb-2">Email Preferences:</p>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={formData.consentBackstage}
            onChange={(e) =>
              setFormData({ ...formData, consentBackstage: e.target.checked })
            }
            className="mt-1"
          />
          <span className="text-sm">
            I accept to receive emails from <strong>The Backstage</strong> about new
            releases, events, and music news.
          </span>
        </label>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={formData.consentGee Beat}
            onChange={(e) => setFormData({ ...formData, consentGee Beat: e.target.checked })}
            className="mt-1"
          />
          <span className="text-sm">
            I accept to receive emails from <strong>Gee Beat</strong> about music
            distribution and promotion.
          </span>
        </label>

        <label className="flex items-start gap-2 opacity-60">
          <input
            type="checkbox"
            checked={formData.consentArtist}
            disabled
            className="mt-1"
          />
          <span className="text-sm">
            I accept to receive emails from <strong>{artistName}</strong> about their
            music and events. <em>(Required to download)</em>
          </span>
        </label>
      </div>

      {/* Validation Error */}
      {!isValid && formData.email && (
        <p className="text-sm text-red-600">
          Please accept at least one email consent (The Backstage or Gee Beat)
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || state === 'loading'}
        className="w-full bg-[#FF5500] text-white font-bold py-3 rounded-lg disabled:opacity-50"
      >
        {state === 'loading' ? 'Submitting...' : 'Download Track'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        By clicking "Download Track", you agree to our{' '}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
```

---

## 🧑‍💻 Backend Use Case Examples

### Direct Use Case Invocation

```typescript
// Example: Programmatically create submission (e.g., admin action)
import { ProcessDownloadGateUseCase } from '@/domain/services/ProcessDownloadGateUseCase';
import { diContainer } from '@/lib/di-container';

async function createSubmissionProgrammatically() {
  const useCase = diContainer.createProcessDownloadGateUseCase();

  const result = await useCase.execute({
    gateSlug: 'summer-vibes-2026',
    email: 'fan@example.com',
    firstName: 'John',
    consentBackstage: true,
    consentGee Beat: true,
    source: 'the_backstage',
    ipAddress: '127.0.0.1', // From admin action
    userAgent: 'Admin Panel',
  });

  console.log('Submission created:', result.submissionId);
}
```

### Validate Token Programmatically

```typescript
// Example: Check if token is valid before displaying download page
import { ValidateDownloadTokenUseCase } from '@/domain/services/ValidateDownloadTokenUseCase';
import { diContainer } from '@/lib/di-container';

async function checkTokenValidity(token: string) {
  const useCase = diContainer.createValidateDownloadTokenUseCase();

  try {
    const result = await useCase.execute({ token });

    if (result.valid) {
      console.log('Token valid! File URL:', result.fileUrl);
      return result.fileUrl;
    }
  } catch (error) {
    if (error instanceof ExpiredTokenError) {
      console.error('Token expired');
    } else if (error instanceof InvalidTokenError) {
      console.error('Token invalid');
    } else if (error instanceof TokenAlreadyUsedError) {
      console.error('Token already used');
    }
    throw error;
  }
}
```

---

## 📊 Analytics Examples

### Track Consent Rates

```typescript
// Example: Calculate consent rates by brand
import { sql } from '@vercel/postgres';

async function getConsentRates(gateSlug: string) {
  const result = await sql`
    SELECT
      COUNT(*) AS total_submissions,
      COUNT(*) FILTER (
        WHERE metadata->>'acceptedBackstage' = 'true'
      ) AS backstage_consents,
      COUNT(*) FILTER (
        WHERE metadata->>'acceptedGee Beat' = 'true'
      ) AS gbid_consents,
      COUNT(*) FILTER (
        WHERE metadata->>'acceptedBackstage' = 'true'
          AND metadata->>'acceptedGee Beat' = 'true'
      ) AS both_consents
    FROM consent_history
    WHERE source = 'download_gate'
      AND metadata->>'gateSlug' = ${gateSlug}
      AND action = 'subscribe'
  `;

  const row = result.rows[0];

  return {
    total: row.total_submissions,
    backstageRate: (row.backstage_consents / row.total_submissions) * 100,
    gbidRate: (row.gbid_consents / row.total_submissions) * 100,
    bothRate: (row.both_consents / row.total_submissions) * 100,
  };
}

// Usage:
const rates = await getConsentRates('summer-vibes-2026');
console.log(`Backstage consent rate: ${rates.backstageRate.toFixed(1)}%`);
console.log(`Gee Beat consent rate: ${rates.gbidRate.toFixed(1)}%`);
console.log(`Both brands: ${rates.bothRate.toFixed(1)}%`);
```

### Track Conversion Funnel

```typescript
// Example: Measure download funnel
async function getConversionFunnel(gateId: string) {
  const result = await sql`
    SELECT
      COUNT(DISTINCT id) AS total_submissions,
      COUNT(DISTINCT id) FILTER (
        WHERE download_token IS NOT NULL
      ) AS tokens_generated,
      COUNT(DISTINCT id) FILTER (
        WHERE download_completed = true
      ) AS downloads_completed
    FROM download_submissions
    WHERE gate_id = ${gateId}
  `;

  const row = result.rows[0];

  return {
    submissions: row.total_submissions,
    tokenRate: (row.tokens_generated / row.total_submissions) * 100,
    downloadRate: (row.downloads_completed / row.total_submissions) * 100,
  };
}

// Usage:
const funnel = await getConversionFunnel('abc-123-def-456');
console.log(`Submissions: ${funnel.submissions}`);
console.log(`Token generation rate: ${funnel.tokenRate.toFixed(1)}%`);
console.log(`Download completion rate: ${funnel.downloadRate.toFixed(1)}%`);
```

---

## 🔔 Email Template Customization

### Custom Download Ready Email

```typescript
// infrastructure/email/templates/CustomDownloadReadyEmail.ts
export class CustomDownloadReadyEmail {
  static getHtml(params: {
    trackTitle: string;
    artistName: string;
    downloadUrl: string;
    brandLogoUrl?: string; // Custom branding
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${params.brandLogoUrl ? `
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="${params.brandLogoUrl}" alt="Logo" style="max-width: 200px; height: auto;">
  </div>
  ` : ''}

  <div style="background: linear-gradient(135deg, #FF5500 0%, #FF8C42 100%); color: white; padding: 40px; text-align: center; border-radius: 12px;">
    <h1 style="margin: 0; font-size: 32px;">Your Download is Ready!</h1>
  </div>

  <div style="background: white; padding: 40px; border-radius: 8px; margin-top: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #FF5500; margin-bottom: 12px;">${params.trackTitle}</h2>
    <p style="color: #666; margin-bottom: 30px;">by <strong>${params.artistName}</strong></p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${params.downloadUrl}"
         style="display: inline-block;
                background-color: #FF5500;
                color: white;
                padding: 18px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 700;
                font-size: 18px;
                box-shadow: 0 4px 12px rgba(255, 85, 0, 0.3);">
        Download Track Now
      </a>
    </div>

    <p style="text-align: center; color: #666; font-size: 14px;">
      This link expires in 24 hours
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
```

---

## 🛠️ Troubleshooting Examples

### Debug Consent Logging

```typescript
// Check if consent was logged correctly
import { sql } from '@vercel/postgres';

async function debugConsentLog(email: string, gateSlug: string) {
  const result = await sql`
    SELECT
      c.id AS contact_id,
      c.email,
      ch.action,
      ch.timestamp,
      ch.ip_address,
      ch.user_agent,
      ch.metadata
    FROM contacts c
    JOIN consent_history ch ON ch.contact_id = c.id
    WHERE c.email = ${email}
      AND ch.metadata->>'gateSlug' = ${gateSlug}
    ORDER BY ch.timestamp DESC
    LIMIT 1
  `;

  if (result.rows.length === 0) {
    console.log('No consent log found');
    return null;
  }

  const log = result.rows[0];
  console.log('Consent Log:', {
    contactId: log.contact_id,
    email: log.email,
    action: log.action,
    timestamp: log.timestamp,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    metadata: log.metadata,
  });

  return log;
}
```

### Test Email Sending

```typescript
// Test email template rendering
import { DownloadReadyEmail } from '@/infrastructure/email/templates/DownloadReadyEmail';

function testEmailTemplate() {
  const html = DownloadReadyEmail.getHtml({
    trackTitle: 'Test Track',
    artistName: 'Test Artist',
    downloadUrl: 'https://example.com/download/test',
    expiryHours: 24,
    fileType: 'wav',
    fileSizeMb: 45.2,
  });

  // Save to file for preview
  const fs = require('fs');
  fs.writeFileSync('/tmp/test-email.html', html);
  console.log('Email template saved to /tmp/test-email.html');

  // Or send test email
  const emailProvider = diContainer.get('emailProvider');
  await emailProvider.send({
    to: 'test@example.com',
    subject: 'Test Email',
    html,
  });
}
```

---

## 📱 Mobile Integration Example

### React Native / Expo

```typescript
// Example: Submit form from mobile app
async function submitDownloadGate(data: {
  email: string;
  firstName?: string;
  consentBackstage: boolean;
  consentGee Beat: boolean;
}) {
  try {
    const response = await fetch(
      'https://thebackstage.app/api/gate/summer-vibes-2026/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          source: 'the_backstage', // Or 'gee_beat'
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const result = await response.json();

    // Navigate to verification screen
    navigation.navigate('Verification', {
      submissionId: result.submissionId,
      requiresVerification: result.requiresVerification,
    });
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}
```

---

## 🎯 Summary

This implementation provides:

- ✅ **Multi-brand consent** (The Backstage + Gee Beat + Artist)
- ✅ **GDPR compliance** (explicit consent, audit trail, unsubscribe)
- ✅ **CAN-SPAM compliance** (List-Unsubscribe headers)
- ✅ **Flexible integration** (React, API, mobile)
- ✅ **Production-ready** (error handling, security, validation)

Choose the integration method that fits your needs!

---

*For more details, see:*
- `docs/DOWNLOAD_GATE_IMPLEMENTATION_SUMMARY.md` - Complete implementation guide
- `docs/PRIVACY_POLICY_DOWNLOAD_GATE.md` - Legal documentation
- `domain/services/*.ts` - Use case implementations with detailed comments
