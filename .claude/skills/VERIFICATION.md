# Skills Verification Checklist

Run these commands to verify the skills are working correctly.

## ✅ Installation Verification

### Check Files Exist
```bash
# Should show 11 files
find .claude/skills -type f \( -name "*.md" -o -name "*.ts" \) | wc -l

# Should list all skill files
ls -R .claude/skills/
```

**Expected Output**: 11 files total
- 3 markdown docs (README, USAGE_EXAMPLES, SKILLS_SUMMARY, VERIFICATION)
- 2 skill prompts (gdpr-compliance-helper/skill.md, webhook-debugger/skill.md)
- 4 scripts (2 per skill)
- 2 legacy skill files (brevo-api.md, soundcloud-api.md)

---

## 🔍 Webhook Debugger Tests

### Test 1: Verify Scripts are Executable
```bash
# Check shebang
head -1 .claude/skills/webhook-debugger/scripts/replay-webhook.ts
# Expected: #!/usr/bin/env tsx

head -1 .claude/skills/webhook-debugger/scripts/test-all-events.ts
# Expected: #!/usr/bin/env tsx
```

### Test 2: Dry Run (Syntax Check)
```bash
# This will fail to connect (expected), but should not have syntax errors
tsx --dry-run .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent 2>&1 | head -5
```

### Test 3: Live Test (Requires Dev Server)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run webhook replay
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent

# Expected: Status 200 or 201
```

### Test 4: Complete Journey
```bash
# Start dev server first
npm run dev

# In another terminal:
tsx .claude/skills/webhook-debugger/scripts/test-all-events.ts

# Expected:
# ✅ Email Sent
# ✅ Email Delivered
# ✅ Email Opened
# ✅ Email Clicked
```

---

## 🔒 GDPR Compliance Tests

### Test 1: Verify Scripts are Executable
```bash
head -1 .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts
# Expected: #!/usr/bin/env tsx

head -1 .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts
# Expected: #!/usr/bin/env tsx
```

### Test 2: Dry Run (Requires Database)
```bash
# Create test contact first
psql $DATABASE_URL -c "
  INSERT INTO contacts (email, subscribed, country, source)
  VALUES ('gdpr-test@example.com', true, 'US', 'test')
  ON CONFLICT (email) DO NOTHING;
"

# Test export
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts gdpr-test@example.com

# Expected: Export file created in exports/
ls -lh exports/gdpr-export-gdpr_test_example_com-*.json
```

### Test 3: Test Deletion (Non-Destructive)
```bash
# Create another test contact
psql $DATABASE_URL -c "
  INSERT INTO contacts (email, subscribed)
  VALUES ('delete-test@example.com', true)
  ON CONFLICT (email) DO NOTHING;
"

# Test deletion (will prompt for confirmation)
tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts delete-test@example.com

# Type 'yes' when prompted

# Verify anonymization
psql $DATABASE_URL -c "
  SELECT id, email, subscribed, metadata
  FROM contacts
  WHERE email LIKE 'deleted-%@anonymized.local'
  ORDER BY id DESC LIMIT 1;
"

# Expected: email = 'deleted-{id}@anonymized.local', subscribed = false
```

---

## 📊 Database Schema Check

### Verify Required Tables Exist
```bash
psql $DATABASE_URL -c "
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('contacts', 'email_logs', 'email_events', 'execution_logs', 'soundcloud_tracks')
  ORDER BY table_name;
"
```

**Expected**: All 5 tables should exist

### Check Columns for GDPR
```bash
# Check if contacts has metadata column (for GDPR flags)
psql $DATABASE_URL -c "
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'contacts'
  AND column_name IN ('email', 'subscribed', 'metadata');
"
```

**Expected**:
- `email` (varchar or text)
- `subscribed` (boolean)
- `metadata` (jsonb) - for storing gdpr_deleted flag

---

## 🎯 Skill Invocation Test

### Test in Claude Code
```bash
# Start Claude Code CLI
claude

# In chat:
/skill webhook-debugger
User: Test the resend webhook with an 'opened' event
```

**Expected**: Claude should use the skill knowledge to:
1. Explain how to run the replay script
2. Show the expected output
3. Guide on verifying the result

---

## 🐛 Troubleshooting

### Issue: "command not found: tsx"
```bash
# Install tsx globally
npm install -g tsx

# Or use via npx
npx tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent
```

### Issue: "Cannot find module '@vercel/postgres'"
```bash
# Install dependencies
npm install

# Verify installation
npm list @vercel/postgres
```

### Issue: "Error: connect ECONNREFUSED"
```bash
# Webhook tests - Start dev server first
npm run dev

# GDPR tests - Check database connection
echo $DATABASE_URL
# Should show: postgres://...
```

### Issue: "Permission denied" when running scripts
```bash
# Make scripts executable
chmod +x .claude/skills/*/scripts/*.ts

# Or always use tsx command
tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts
```

### Issue: Export directory doesn't exist
```bash
# Create exports directory
mkdir -p exports

# Run export again
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts test@example.com
```

---

## ✅ Success Criteria

All tests pass when:

**Webhook Debugger**:
- [x] Scripts have correct shebang
- [x] Replay script returns 200/201 status
- [x] Journey test completes all 4 events
- [x] Events appear in email_events table
- [x] No syntax errors

**GDPR Compliance**:
- [x] Scripts have correct shebang
- [x] Export creates JSON file in exports/
- [x] Export includes all contact data
- [x] Deletion anonymizes email address
- [x] Deletion preserves anonymized records
- [x] metadata.gdpr_deleted flag set to true

**Database**:
- [x] All 5 required tables exist
- [x] contacts has metadata column (jsonb)
- [x] No foreign key constraint violations

**Documentation**:
- [x] README.md explains both skills
- [x] USAGE_EXAMPLES.md has working examples
- [x] SKILLS_SUMMARY.md lists all features

---

## 📈 Performance Benchmarks

Run these to measure performance:

```bash
# Webhook replay speed (should be <100ms)
time tsx .claude/skills/webhook-debugger/scripts/replay-webhook.ts resend sent

# GDPR export speed (should be <500ms for small dataset)
time tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts test@example.com

# GDPR deletion speed (should be <1s)
time tsx .claude/skills/gdpr-compliance-helper/scripts/delete-contact.ts test@example.com --confirm
```

---

## 🎉 Final Verification

```bash
# Run complete test suite
echo "Testing Webhook Debugger..."
npm run dev &
sleep 3
tsx .claude/skills/webhook-debugger/scripts/test-all-events.ts
echo ""

echo "Testing GDPR Export..."
tsx .claude/skills/gdpr-compliance-helper/scripts/export-contact-data.ts gdpr-test@example.com
echo ""

echo "✅ All tests complete!"
echo "Check the output above for any errors"
```

---

**Last Updated**: 2025-12-22
**Skills Version**: 1.0.0
**Status**: Ready for Production ✅
