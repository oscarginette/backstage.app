#!/bin/bash

# Script to add proper error message extraction after changing error: any to error: unknown
# This script finds patterns like "error.message" inside catch(error: unknown) blocks
# and adds proper type guards

set -e

echo "Adding proper error message extraction patterns..."

# Find all files that have catch (error: unknown) and error.message
FILES=$(grep -l "catch (error: unknown)" app/api/**/*.ts 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "No files found to update"
  exit 0
fi

echo "Checking files for error.message usage..."

for file in $FILES; do
  # Check if file contains error.message after catch (error: unknown)
  if grep -q "error.message" "$file"; then
    echo "⚠️  Found error.message in: $file"
    echo "   Manual review needed for this file"
  fi
done

echo ""
echo "Files that need manual error message extraction have been identified above."
echo "Please add proper error message extraction like:"
echo "  const errorMessage = error instanceof Error ? error.message : 'Default message';"
