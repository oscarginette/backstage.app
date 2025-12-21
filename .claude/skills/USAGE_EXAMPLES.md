# Skills Usage Examples

Quick reference for using the gdpr-compliance-helper and webhook-debugger skills.

## Webhook Debugger Examples

### Example 1: Test Email Opens Tracking
```bash
# Start your dev server
npm run dev

# In another terminal, simulate an email open event
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend opened

# Check if it was recorded
psql $DATABASE_URL -c "SELECT * FROM email_events WHERE event_type = 'opened' ORDER BY timestamp DESC LIMIT 1;"
```

**Expected Output**:
```
🔄 Replaying resend webhook: opened
URL: http://localhost:3002/api/webhooks/resend
Payload: {
  "type": "email.opened",
  "created_at": "2025-12-22T...",
  "data": {
    "email_id": "re_mock_opened_...",
    "to": ["test@example.com"]
  }
}

Status: 200 OK
✅ Webhook replayed successfully
```

---

### Example 2: Test Complete Email Journey
```bash
# Simulates: sent → delivered → opened → clicked
tsx .claude/skills/webhook-debugger/scripts/test-all-events.ts

# View results in dashboard
open http://localhost:3002/api/email-stats
```

**What it does**:
- Sends 4 webhook events in sequence with realistic delays
- Creates complete email journey for `webhook-test@example.com`
- All events use the same `email_id` for correlation

---

### Example 3: Test Bounce Handling
```bash
# Simulate a hard bounce
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend bounced

# Verify bounce was recorded
psql $DATABASE_URL -c "SELECT * FROM email_events WHERE event_type = 'bounced' LIMIT 1;"
```

---

### Example 4: Debug Production Webhook
```bash
# 1. Setup ngrok tunnel for local testing
ngrok http 3002

# 2. Copy the https URL (e.g., https://abc123.ngrok.io)

# 3. Update Resend webhook settings:
#    https://abc123.ngrok.io/api/webhooks/resend

# 4. Send a real test email
curl -X POST http://localhost:3002/api/test-email

# 5. Watch your terminal for incoming webhook
# Ngrok will forward real Resend events to your local server
```

---

## GDPR Compliance Examples

### Example 1: Export User Data (GDPR Request)
```bash
# User requests their data
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts john@example.com
```

**Expected Output**:
```
📋 GDPR Data Export for: john@example.com
════════════════════════════════════════════════════════════

1️⃣  Fetching contact profile...
2️⃣  Fetching email send history...
3️⃣  Fetching engagement events...
4️⃣  Fetching campaign participation...
5️⃣  Fetching tracks sent...

✅ Export Complete!

📊 Summary:
   Contact: john@example.com
   Subscribed: true
   Total emails sent: 12
   Total events: 45
     - Sent: 12
     - Delivered: 12
     - Opened: 8
     - Clicked: 3
     - Bounced: 0
   Campaigns participated: 12
   Tracks received: 12

💾 Exported to: exports/gdpr-export-john_example_com-1703212345678.json
```

**Export File Structure**:
```json
{
  "export_metadata": {
    "email": "john@example.com",
    "export_date": "2025-12-22T12:00:00.000Z",
    "purpose": "GDPR Article 15 - Right of Access"
  },
  "contact_profile": { ... },
  "email_send_history": {
    "total_emails": 12,
    "records": [ ... ]
  },
  "engagement_events": { ... },
  "campaign_participation": { ... },
  "tracks_received": { ... }
}
```

---

### Example 2: Delete User Data (GDPR Deletion)
```bash
# User requests deletion
tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts jane@example.com
```

**Interactive Prompt**:
```
🗑️  GDPR Contact Deletion for: jane@example.com

1️⃣  Checking contact exists...
✅ Contact found:
   ID: 42
   Email: jane@example.com
   Subscribed: true
   Created: 2024-01-15T10:30:00.000Z

2️⃣  Analyzing data to be anonymized...
   Email sends: 25
   Events tracked: 87

⚠️  WARNING: This will:
   - Anonymize the email address
   - Mark contact as unsubscribed
   - Preserve anonymized records for 7 years (legal requirement)
   - This action CANNOT be undone

❓ Continue with deletion? (yes/no): yes

3️⃣  Performing GDPR deletion (anonymization)...
✅ Anonymization complete!

✅ GDPR Deletion Summary:
   Original email: jane@example.com
   Anonymized to: deleted-42@anonymized.local
   Contact ID: 42
   Records anonymized:
     - Email logs: 25
     - Events: 87
   Deletion timestamp: 2025-12-22T12:30:00.000Z

📋 Legal Notice:
   - Anonymized records retained for 7 years
   - Contact marked as unsubscribed
   - No further emails will be sent
```

**Verify Deletion**:
```bash
# Check contact is anonymized
psql $DATABASE_URL -c "SELECT * FROM contacts WHERE id = 42;"

# Should show:
# email: deleted-42@anonymized.local
# subscribed: false
# metadata.gdpr_deleted: true
```

---

### Example 3: Bulk Delete (Skip Confirmation)
```bash
# Delete multiple contacts (automated script)
for email in spam1@example.com spam2@example.com spam3@example.com; do
  tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts "$email" --confirm
done
```

---

### Example 4: Check GDPR Compliance Status
```bash
# Find all contacts without consent timestamp
psql $DATABASE_URL -c "
  SELECT email, created_at, metadata
  FROM contacts
  WHERE subscribed = true
  AND (metadata->>'consent_timestamp' IS NULL
       OR metadata->>'consent_source' IS NULL)
  LIMIT 10;
"

# These contacts may need consent re-confirmation
```

---

## Invoke Skills in Claude Code

### Ask GDPR Questions
```
/skill gdpr-compliance-helper

User: Can you export data for test@example.com?
```

Claude will use the skill knowledge to:
1. Run the export script
2. Explain GDPR compliance requirements
3. Provide the export file location

---

### Debug Webhooks
```
/skill webhook-debugger

User: Why aren't email opens being tracked?
```

Claude will:
1. Check webhook logs
2. Simulate test events
3. Verify database records
4. Identify the issue

---

## Integration with Existing System

### Current Workflow Enhanced

**Before (Manual)**:
1. User requests data → Manually query database → Format JSON → Send
2. User requests deletion → Manually UPDATE → Hope you got all tables

**After (With Skills)**:
1. User requests data → `tsx export-contact-data.ts email@example.com` → Done
2. User requests deletion → `tsx delete-contact.ts email@example.com` → GDPR compliant

**Before (Webhook Debugging)**:
1. Email opens not tracking → Check Resend dashboard → Check code → Check DB → ???
2. Takes 30 minutes to debug

**After (With Skills)**:
1. Email opens not tracking → `tsx replay-webhook.ts resend opened` → See exact error
2. Takes 2 minutes to debug

---

## Production Checklist

### Before Deployment
- [ ] Test all webhook events with replay scripts
- [ ] Verify GDPR export includes all tables
- [ ] Test GDPR deletion anonymizes all references
- [ ] Setup ngrok for local webhook testing
- [ ] Document consent tracking requirements
- [ ] Add webhook signature verification
- [ ] Setup webhook monitoring dashboard
- [ ] Create consent_history table
- [ ] Configure GDPR retention policies

### Regular Maintenance
- [ ] Weekly: Check webhook health (`/api/webhooks/monitor`)
- [ ] Monthly: Review GDPR deletion logs
- [ ] Quarterly: Audit consent timestamps
- [ ] Annually: Review data retention (delete >7yr old data)

---

## Troubleshooting

### "Contact not found" in export
- Check spelling of email
- Verify contact exists: `psql $DATABASE_URL -c "SELECT * FROM contacts WHERE email = 'xxx';"`

### Webhook replay returns 500
- Check dev server is running: `npm run dev`
- Verify database connection: `echo $DATABASE_URL`
- Check webhook handler code: `app/api/webhooks/resend/route.ts`

### Export file empty
- Check database has data for that contact
- Verify table names match schema
- Check file was created in `exports/` directory

---

**Need Help?** Invoke the skill and ask Claude Code!
