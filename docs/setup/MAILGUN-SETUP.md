# Mailgun Setup Guide

Complete guide for integrating Mailgun as the email provider for The Backstage.

---

## 📋 Prerequisites

- Mailgun account (https://app.mailgun.com/)
- Access to DNS configuration (for production domain)
- Environment file (.env.local or .env)

---

## 1. Account Setup

### Create Mailgun Account

1. Go to https://app.mailgun.com/
2. Sign up for a new account (or log in)
3. Complete email verification
4. Navigate to **Sending → Domains**

### Get API Credentials

1. Go to **Settings → API Keys**
2. Copy your **Private API Key**
   - Format: `key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - Keep this secret - never commit to git!

---

## 2. Domain Configuration

### Option A: Sandbox Domain (Testing)

**Best for**: Local development, testing

**Advantages**:
- ✅ Instant setup (no DNS configuration)
- ✅ Ready to use immediately
- ✅ Free tier includes sandbox

**Limitations**:
- ❌ Limited to 5 authorized recipients
- ❌ Emails have "via mailgun.org" sender
- ❌ Not suitable for production

**Setup**:
1. Your sandbox domain is auto-created: `sandboxXXXXX.mailgun.org`
2. Add authorized recipients:
   - Go to **Sending → Domains → [Your Sandbox]**
   - Click **Authorized Recipients**
   - Add your test email addresses

### Option B: Custom Domain (Production)

**Best for**: Production use, branded emails

**Setup**:

1. **Add Domain to Mailgun**:
   - Go to **Sending → Domains**
   - Click **Add New Domain**
   - Enter your domain (e.g., `thebackstage.app`)
   - Click **Add Domain**

2. **Configure DNS Records**:

   Mailgun will show you DNS records to add. Add these to your DNS provider:

   **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:mailgun.org ~all
   ```

   **DKIM Record** (TXT):
   ```
   Type: TXT
   Name: smtp._domainkey
   Value: [Copy from Mailgun dashboard]
   ```

   **Tracking CNAME** (Optional, for open/click tracking):
   ```
   Type: CNAME
   Name: email
   Value: mailgun.org
   ```

   **DMARC Record** (Recommended):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:postmaster@thebackstage.app
   ```

3. **Verify Domain**:
   - Wait 24-48 hours for DNS propagation
   - Click **Verify DNS Settings** in Mailgun dashboard
   - Status should show "Active" when verified

---

## 3. Environment Configuration

Add these variables to `.env.local` (development) or `.env` (production):

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your-api-key-here
MAILGUN_DOMAIN=sandboxXXXXX.mailgun.org  # or thebackstage.app for production
MAILGUN_API_URL=https://api.mailgun.net
MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key-here  # Get from Step 4
USE_MAILGUN=true  # Set to true to enable Mailgun (false = use Resend)
```

**Important**:
- Never commit `.env.local` to git
- For production (Vercel), set these in Vercel dashboard

---

## 4. Webhook Configuration

Webhooks allow real-time tracking of email events (delivered, opened, clicked, bounced).

### Setup Webhooks

1. **Go to Mailgun Dashboard**:
   - **Sending → Webhooks**
   - Select your domain

2. **Add Webhook Endpoint**:
   - Click **Add webhook**
   - URL: `https://thebackstage.app/api/webhooks/mailgun`
   - For local testing: Use ngrok or similar tunnel

3. **Select Events**:
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Permanent Failure
   - ✅ Temporary Failure
   - ✅ Complained (spam complaints)
   - ✅ Unsubscribed

4. **Get Signing Key**:
   - After creating webhook, Mailgun shows **HTTP webhook signing key**
   - Copy this key
   - Add to `.env.local`:
     ```bash
     MAILGUN_WEBHOOK_SIGNING_KEY=your-signing-key-here
     ```

### Test Webhook

```bash
# Test that webhook endpoint is accessible
curl https://thebackstage.app/api/webhooks/mailgun

# Should return:
# {
#   "status": "active",
#   "endpoint": "/api/webhooks/mailgun",
#   "provider": "mailgun",
#   "events": [...]
# }
```

---

## 5. Testing Integration

### Run Integration Test Script

```bash
# Make sure environment variables are set
tsx scripts/test-mailgun-integration.ts
```

**Expected output**:
```
🧪 Testing Mailgun Integration

Test 1: Sending simple email...
✅ Test 1 PASSED
   Message ID: <...@sandboxXXXXX.mailgun.org>

Test 2: Email with tags...
✅ Test 2 PASSED
   Message ID: <...@sandboxXXXXX.mailgun.org>

...

🎉 All tests completed!
```

### Verify Email Delivery

1. Check inbox at recipient email
2. Should receive 5 test emails
3. Verify:
   - ✅ Emails received
   - ✅ Correct subject lines
   - ✅ Headers include List-Unsubscribe (Test 3)
   - ✅ Reply-To is correct (Test 4)

### Monitor in Mailgun Dashboard

1. Go to **Sending → Logs**
2. View recent email sends
3. Click on email to see delivery details
4. Check for any errors or bounces

---

## 6. Production Deployment Checklist

### Pre-Deployment

- [ ] Custom domain verified in Mailgun
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] All 5 integration tests passing
- [ ] Webhook endpoint configured and tested
- [ ] Environment variables set in Vercel

### Deploy to Vercel

1. **Set Environment Variables**:
   ```bash
   vercel env add MAILGUN_API_KEY production
   # Enter your API key

   vercel env add MAILGUN_DOMAIN production
   # Enter your domain (e.g., thebackstage.app)

   vercel env add MAILGUN_WEBHOOK_SIGNING_KEY production
   # Enter your signing key

   vercel env add USE_MAILGUN production
   # Enter: true
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Verify Deployment**:
   - Send test email via app
   - Check Mailgun logs
   - Verify webhook events received

### Post-Deployment

- [ ] Send 10 real emails to real users
- [ ] Monitor deliverability in Mailgun dashboard
- [ ] Check webhook events are processing correctly
- [ ] Verify emails NOT going to spam
- [ ] Monitor bounce rate (<2%)
- [ ] Monitor complaint rate (<0.1%)

---

## 7. Suppression Lists (Multi-Tenant)

Mailgun automatically maintains suppression lists to protect your sender reputation:

### Types of Suppressions

1. **Bounces**: Hard bounces (permanent failures)
   - Invalid email addresses
   - Non-existent domains
   - Mailbox disabled

2. **Complaints**: Spam complaints
   - User marked email as spam
   - Automatic unsubscribe

3. **Unsubscribes**: User unsubscribed
   - Via List-Unsubscribe header
   - Via unsubscribe link

### View Suppressions

1. Go to **Sending → Suppressions**
2. Select your domain
3. View bounces, complaints, unsubscribes

### Per-DJ Suppression (Multi-Tenant)

For multi-tenant setup (multiple DJs), use **tags** to separate:

```typescript
// When sending email for DJ with user_id=123
tags: [{ name: 'user_id', value: '123' }]
```

Then in Mailgun dashboard:
1. **Suppressions** → Filter by tag
2. Export suppression list for specific DJ
3. Use Mailgun API to query suppressions by tag

---

## 8. Monitoring & Analytics

### Mailgun Dashboard

1. **Analytics** (Sending → Analytics):
   - Delivery rate
   - Open rate
   - Click rate
   - Bounce rate
   - Complaint rate

2. **Logs** (Sending → Logs):
   - Last 2 days of email logs
   - Filter by status, recipient, tag
   - View full email details

### Database Monitoring

Query `email_events` table:

```sql
-- Recent email events
SELECT * FROM email_events
ORDER BY created_at DESC
LIMIT 100;

-- Events by type
SELECT event_type, COUNT(*) as count
FROM email_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type;

-- Bounce rate by day
SELECT DATE(created_at) as date,
       SUM(CASE WHEN event_type = 'bounced' THEN 1 ELSE 0 END)::float /
       SUM(CASE WHEN event_type = 'delivered' THEN 1 ELSE 0 END) as bounce_rate
FROM email_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 9. Troubleshooting

### Email Not Sent

**Symptom**: Test script shows error

**Solutions**:
1. Verify API key is correct
   ```bash
   echo $MAILGUN_API_KEY
   ```
2. Check domain is active in Mailgun
3. For sandbox: Verify recipient is authorized
4. Check Mailgun logs for error details

### Webhook Not Received

**Symptom**: Emails sent, but no events in database

**Solutions**:
1. Verify webhook URL is publicly accessible
   ```bash
   curl https://thebackstage.app/api/webhooks/mailgun
   ```
2. Check signing key matches environment variable
3. View webhook logs in Mailgun dashboard (Sending → Webhooks → Logs)
4. Check application logs for webhook errors

### Emails Going to Spam

**Symptom**: Emails delivered but in spam folder

**Solutions**:
1. Verify SPF, DKIM, DMARC records configured
   ```bash
   dig TXT thebackstage.app
   dig TXT smtp._domainkey.thebackstage.app
   dig TXT _dmarc.thebackstage.app
   ```
2. Warm up sending (gradually increase volume)
3. Monitor bounce/complaint rates
4. Use email testing tools (mail-tester.com)
5. Avoid spam trigger words in subject/body

### Rate Limits

**Symptom**: Emails rejected after certain volume

**Solution**:
1. Check your Mailgun plan limits
2. Upgrade plan if needed
3. Implement retry logic with exponential backoff
4. Contact Mailgun support to increase limits

---

## 10. Migration from Resend

### Gradual Migration Strategy

Use feature flag for A/B testing:

```bash
# Start with 10% traffic to Mailgun
# Randomly assign 10% of users
USE_MAILGUN=true  # for test users
USE_MAILGUN=false # for majority
```

### Migration Timeline

**Day 1-3**: 10% traffic
- Monitor metrics
- Compare with Resend
- Fix any issues

**Day 4-7**: 50% traffic
- Increase gradually
- Continue monitoring

**Day 8+**: 100% traffic
- Full migration
- Keep Resend as backup for 30 days

### Rollback Plan

If issues occur:

```bash
# Instant rollback via environment variable
vercel env rm USE_MAILGUN production
vercel env add USE_MAILGUN production
# Enter: false

vercel --prod
```

---

## 11. Cost Estimation

### Mailgun Pricing (2026)

- **Free trial**: 5,000 emails/month for 3 months
- **Pay-as-you-go**: $0.80 per 1,000 emails
- **Foundation**: $35/month for 50,000 emails
- **Growth**: $80/month for 100,000 emails

### Example Costs

| Monthly Emails | Plan | Monthly Cost |
|---------------|------|--------------|
| 5,000 | Free trial | $0 |
| 10,000 | Pay-as-you-go | $8 |
| 50,000 | Foundation | $35 |
| 100,000 | Growth | $80 |
| 500,000 | Custom | ~$400 |

Compare to Resend: Similar pricing, but Mailgun offers more features.

---

## 12. Best Practices

### Email Content

- ✅ Always include unsubscribe link
- ✅ Use plain text alternative
- ✅ Avoid spam trigger words
- ✅ Personalize sender name
- ✅ Keep subject lines under 50 characters

### Deliverability

- ✅ Verify SPF, DKIM, DMARC
- ✅ Warm up sending (gradual increase)
- ✅ Monitor bounce/complaint rates
- ✅ Clean email lists regularly
- ✅ Use double opt-in for new subscribers

### Security

- ✅ Verify webhook signatures (always)
- ✅ Use HTTPS for webhook URLs
- ✅ Rotate API keys periodically
- ✅ Never commit secrets to git
- ✅ Use environment variables for all credentials

---

## 13. Support & Resources

### Documentation

- [Mailgun API Reference](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun)
- [Webhook Guide](https://documentation.mailgun.com/docs/mailgun/user-manual/events/webhooks)
- [Best Practices](https://www.mailgun.com/blog/product/a-guide-to-using-mailguns-webhooks/)

### Support

- Mailgun Support: support@mailgun.com
- Dashboard: https://app.mailgun.com/
- Status Page: https://status.mailgun.com/

---

## ✅ Quick Start Checklist

For the impatient:

```bash
# 1. Install dependencies
npm install mailgun.js form-data

# 2. Add to .env.local
MAILGUN_API_KEY=your-key
MAILGUN_DOMAIN=your-domain
USE_MAILGUN=true

# 3. Test integration
tsx scripts/test-mailgun-integration.ts

# 4. Send test email via app
# 5. Check inbox + Mailgun logs
# 6. Configure webhooks
# 7. Deploy to production
```

Done! 🎉
