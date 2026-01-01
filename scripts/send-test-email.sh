#!/bin/bash
# Send Sentry test email to geebeat@hotmail.com
# This script sends the test email via the production API

set -e

echo "🧪 Sentry Integration Test - Send Email"
echo "=========================================="
echo ""

# Draft ID (you need to create this in the database first)
DRAFT_ID="sentry-test-$(date +%Y%m%d-%H%M%S)"
USER_ID=1

echo "📝 Draft ID: $DRAFT_ID"
echo "👤 User ID: $USER_ID"
echo "📧 Recipient: geebeat@hotmail.com (only)"
echo ""

echo "⚠️  PREREQUISITES:"
echo "1. Ensure geebeat@hotmail.com is the ONLY subscribed contact"
echo "2. Create draft campaign in database with ID: $DRAFT_ID"
echo ""

read -p "Have you completed the prerequisites? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Please complete prerequisites first."
    echo ""
    echo "Run these SQL commands in production database:"
    echo ""
    echo "-- 1. Unsubscribe all except geebeat@hotmail.com"
    echo "UPDATE contacts SET subscribed = false"
    echo "WHERE subscribed = true AND email != 'geebeat@hotmail.com';"
    echo ""
    echo "-- 2. Ensure geebeat@hotmail.com is subscribed"
    echo "UPDATE contacts SET subscribed = true"
    echo "WHERE email = 'geebeat@hotmail.com';"
    echo ""
    echo "-- 3. Create test draft"
    echo "INSERT INTO email_campaigns (id, subject, html_content, status, user_id, created_at)"
    echo "VALUES ("
    echo "  '$DRAFT_ID',"
    echo "  '🧪 Sentry Integration Test',"
    echo "  '<h1>Sentry Test</h1><p>If you see this, Sentry tracking is active!</p>',"
    echo "  'draft',"
    echo "  1,"
    echo "  NOW()"
    echo ");"
    exit 1
fi

echo ""
echo "🚀 Sending test email..."
echo ""

RESPONSE=$(curl -s -X POST https://backstage-art.vercel.app/api/campaigns/send \
  -H "Content-Type: application/json" \
  -d "{
    \"draftId\": \"$DRAFT_ID\",
    \"userId\": $USER_ID
  }")

echo "📨 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Test email sent successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Check email at geebeat@hotmail.com"
    echo "2. Check Sentry dashboard:"
    echo "   https://sentry.io/organizations/oscarginette/performance/"
    echo "3. Filter by: SendCampaign"
    echo "4. You should see transaction with:"
    echo "   - Duration: ~250ms"
    echo "   - Spans: DB queries + email send"
    echo "   - Breadcrumbs: Full execution trail"
else
    echo "❌ Failed to send email"
    echo "Check the error message above"
fi

echo ""
echo "🔄 To restore contacts, run the SQL from SENTRY_TEST_INSTRUCTIONS.md"
