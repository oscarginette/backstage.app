#!/bin/bash

# Script to add error message extraction in catch blocks
# This adds: const errorMessage = error instanceof Error ? error.message : 'Default message';

set -e

FILES_TO_FIX=(
  "app/api/send-custom-email/route.ts"
  "app/api/resubscribe/route.ts"
  "app/api/unsubscribe/route.ts"
  "app/api/test-email/route.ts"
  "app/api/test-email-html/route.ts"
  "app/api/soundcloud-tracks/route.ts"
  "app/api/reset-track/route.ts"
  "app/api/proxy-image/route.ts"
  "app/api/migrate/route.ts"
  "app/api/migrate-templates/route.ts"
  "app/api/email-stats/route.ts"
  "app/api/check-spotify/route.ts"
  "app/api/check-soundcloud/route.ts"
)

echo "Adding error message extraction to API route files..."

for file in "${FILES_TO_FIX[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Use perl for more complex regex replacement
    # Pattern: Find "} catch (error: unknown) {" followed by lines that use error.message
    # Add error message extraction right after the catch block starts
    perl -i.tmp -0pe '
      s/(} catch \(error: unknown\) \{\s*\n\s*)(console\.error\([^;]+error\);)/\1const errorMessage = error instanceof Error ? error.message : '\''Unknown error'\'\';\n    \2/g;
      s/error\.message/errorMessage/g if /catch \(error: unknown\)/;
    ' "$file"

    # Remove temporary file
    rm -f "$file.tmp"

    echo "  ✓ Updated $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "Done!"
