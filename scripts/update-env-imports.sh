#!/bin/bash
#
# Script to update process.env accesses to use typed env from @/lib/env
#

# Files to update (excluding docs, scripts, and test files for now)
FILES=(
  "domain/services/SendNewUserNotificationUseCase.ts"
  "domain/services/SendSubscriptionActivatedEmailUseCase.ts"
  "domain/services/SendDraftUseCase.ts"
  "domain/services/SendCustomEmailUseCase.ts"
  "domain/services/SaveDraftUseCase.ts"
  "emails/new-track.tsx"
  "emails/custom-email.tsx"
  "app/api/auth/signup/route.ts"
  "app/api/admin/promote-user/route.ts"
  "app/api/execution-history/route.ts"
  "app/api/webhook/hypedit/route.ts"
  "app/api/auth/soundcloud/route.ts"
  "app/api/auth/soundcloud/callback/route.ts"
  "app/api/check-music-platforms/route.ts"
  "app/api/check-spotify/route.ts"
  "app/api/check-soundcloud/route.ts"
  "app/api/test-email/route.ts"
  "app/api/test-email-html/route.ts"
)

echo "Updating files to use typed env imports..."

for file in "${FILES[@]}"; do
  filepath="/Users/user/Code/backstage.app/$file"
  if [ -f "$filepath" ]; then
    echo "Processing: $file"

    # Check if file already imports from @/lib/env
    if grep -q "from '@/lib/env'" "$filepath" || grep -q 'from "@/lib/env"' "$filepath"; then
      echo "  ✓ Already imports from @/lib/env, skipping import addition"
    else
      # Add import at the top (after existing imports)
      # This is a simple approach - add after the last import line
      sed -i '' '/^import.*from/a\
import { env, getAppUrl, getBaseUrl } from '\''@/lib/env'\'';
' "$filepath"
      echo "  + Added import statement"
    fi

    # Now replace common process.env patterns
    # This will be done manually for precision
    echo "  → Manual replacement needed for process.env usage"
  else
    echo "File not found: $filepath"
  fi
done

echo ""
echo "Phase 1 complete. Now manually replace process.env usage with env."
