# 🧪 Sentry Integration Test Instructions

## ✅ Step 1: Wait for Deployment

The Sentry-integrated code has been pushed. Wait for Vercel to finish deploying.

Check deployment status:
```bash
vercel ls backstage-art
```

Or visit: https://vercel.com/oscarginettes-projects/backstage-art

---

## 📧 Step 2: Prepare Test Email (geebeat@hotmail.com only)

### Option A: Use Production Database Directly (Recommended)

Access production database via Vercel dashboard:
1. Go to Vercel project → Storage → Neon Database
2. Or use the production POSTGRES_URL directly

```sql
-- 1. Check current contacts
SELECT id, email, subscribed FROM contacts;

-- 2. Ensure geebeat@hotmail.com exists and is subscribed
UPDATE contacts
SET subscribed = true
WHERE email = 'geebeat@hotmail.com';

-- 3. Temporarily unsubscribe others (SAVE THEIR IDs FIRST!)
-- Save current state
SELECT id, email FROM contacts WHERE subscribed = true AND email != 'geebeat@hotmail.com';

-- Temporarily unsubscribe
UPDATE contacts
SET subscribed = false
WHERE subscribed = true
  AND email != 'geebeat@hotmail.com';

-- 4. Create test draft
INSERT INTO email_campaigns (id, subject, html_content, status, user_id, created_at)
VALUES (
  'sentry-test-2026-01-01',
  '🧪 Sentry Integration Test',
  '<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
      .content { background: #f7fafc; padding: 30px; margin-top: 20px; border-radius: 8px; }
      .badge { background: #48bb78; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>🧪 Sentry Test</h1>
      <span class="badge">TEST EMAIL</span>
    </div>

    <div class="content">
      <h2>✅ Sentry Monitoring Active!</h2>

      <p>This email confirms the Sentry integration is working.</p>

      <h3>📊 What''s Being Tracked:</h3>
      <ul>
        <li><strong>User Context</strong> - User ID tracked</li>
        <li><strong>DB Queries</strong> - Performance monitored</li>
        <li><strong>Email Sends</strong> - Individual tracking</li>
        <li><strong>Errors</strong> - Full context captured</li>
        <li><strong>Breadcrumbs</strong> - Execution trail</li>
      </ul>

      <h3>🔍 Check Sentry:</h3>
      <p><a href="https://sentry.io/organizations/oscarginette/issues/">Sentry Dashboard</a></p>

      <p><strong>Performance</strong> → Filter "SendCampaign"</p>
      <p><strong>Issues</strong> → Any errors appear here</p>

      <hr style="margin: 20px 0;">

      <p style="color: #718096; font-size: 14px;">
        Test Campaign ID: sentry-test-2026-01-01<br>
        Sent: ' || NOW() || '
      </p>

      <p><a href="https://backstage-art.vercel.app/unsubscribe?token=TEMP_TOKEN">Unsubscribe</a></p>
    </div>
  </body>
</html>',
  'draft',
  1,
  NOW()
);
```

---

## 🚀 Step 3: Send Test Email

Once deployment is complete and draft is created:

```bash
curl -X POST https://backstage-art.vercel.app/api/campaigns/send \
  -H "Content-Type: application/json" \
  -d '{
    "draftId": "sentry-test-2026-01-01",
    "userId": 1
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "campaignId": "sentry-test-2026-01-01",
  "emailsSent": 1,
  "emailsFailed": 0,
  "totalContacts": 1,
  "duration": 250
}
```

---

## 📊 Step 4: Check Sentry Dashboard

### Performance Tab
https://sentry.io/organizations/oscarginette/performance/

1. Filter by: `SendCampaign`
2. You should see:
   - **Transaction**: SendCampaign
   - **Duration**: ~250ms (for 1 email)
   - **Spans**:
     - `getCampaignById` - ~15ms
     - `getSubscribedContacts` - ~50ms
     - `SendEmailBatch` - ~150ms
       - `SendEmail` - ~45ms
     - `markCampaignAsSent` - ~10ms

### Issues Tab (If Any Errors)
https://sentry.io/organizations/oscarginette/issues/

If something went wrong, you'll see:
- **Error message** with full stack trace
- **User context**: userId: 1
- **Breadcrumbs**:
  1. Starting campaign send
  2. Campaign retrieved
  3. Contacts retrieved
  4. Emails sent
- **Metadata**:
  - draftId: sentry-test-2026-01-01
  - email: geebeat@hotmail.com
  - campaignId: sentry-test-2026-01-01

---

## 🔄 Step 5: Restore Contacts

After testing, restore contacts to original state:

```sql
-- Re-subscribe contacts that were originally subscribed
-- (Use the IDs you saved in Step 2)
UPDATE contacts
SET subscribed = true
WHERE email IN ('other@example.com', 'another@example.com');  -- Your saved emails

-- Clean up test draft
DELETE FROM email_campaigns
WHERE id = 'sentry-test-2026-01-01';
```

---

## ✅ Success Checklist

- [ ] Deployment finished successfully
- [ ] Test draft created in database
- [ ] Only geebeat@hotmail.com is subscribed
- [ ] API call returned `success: true, emailsSent: 1`
- [ ] Email received at geebeat@hotmail.com
- [ ] Sentry Performance tab shows `SendCampaign` transaction
- [ ] No errors in Sentry Issues tab (or expected errors if you tested failure scenarios)
- [ ] Contacts restored to original state
- [ ] Test draft deleted

---

## 📸 What to Look for in Sentry

### 1. Transaction Details
Click on the `SendCampaign` transaction to see:
- Total duration
- Breakdown by operation:
  - Database queries
  - Email sending
  - Each individual span

### 2. Breadcrumbs
In the transaction details, you'll see breadcrumbs:
```
[INFO] Starting campaign send (draftId: sentry-test-2026-01-01, userId: 1)
[INFO] Campaign retrieved (campaignId: sentry-test-2026-01-01, subject: "🧪 Sentry Integration Test", status: "draft")
[INFO] Contacts retrieved (totalContacts: 1)
[INFO] Emails sent (emailsSent: 1, emailsFailed: 0)
```

### 3. Performance Insights
Navigate to **Performance** → **Database**:
- See which queries are slow
- Identify N+1 query issues
- Track query performance over time

---

## 🎯 Next Priority Use Cases

After confirming this works:

1. **ImportContactsUseCase** (~15 min)
2. **CheckNewTracksUseCase** (~10 min)

---

**Questions?** Check the full documentation in `SENTRY_INTEGRATION_COMPLETE.md`
