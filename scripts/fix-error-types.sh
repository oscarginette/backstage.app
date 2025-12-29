#!/bin/bash

# Script to replace error: any with error: unknown in all TypeScript files
# and add proper error message extraction

set -e

echo "Fixing error: any patterns in TypeScript files..."

# Find all TypeScript files with "catch (error: any)"
FILES=$(grep -rl "catch.*error:\s*any" app/api --include="*.ts" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "No files found with 'error: any' pattern in app/api"
  exit 0
fi

echo "Found files to update:"
echo "$FILES"
echo ""

# Use a temporary file for sed operations
for file in $FILES; do
  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.bak"

  # Replace "catch (error: any)" with "catch (error: unknown)"
  sed -i '' 's/catch (error: any)/catch (error: unknown)/g' "$file"

  echo "  ✓ Updated catch blocks to use 'error: unknown'"
done

echo ""
echo "Done! Updated $(echo "$FILES" | wc -l) files"
echo "Backups created with .bak extension"
echo ""
echo "NEXT STEPS:"
echo "1. Review the changes"
echo "2. Add proper error message extraction where needed"
echo "3. Run: npm run type-check"
echo "4. Remove backups: find . -name '*.bak' -delete"
