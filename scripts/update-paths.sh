#!/bin/bash

# Script to help identify files that need path updates
# This is a helper script - actual updates should be done carefully with the Edit tool

echo "=== Files with hardcoded paths that need PATHS import ==="
echo ""

# Find all TSX/TS files with href or router navigation
grep -rn --include="*.tsx" --include="*.ts" \
  -e 'href="/[^"]*"' \
  -e "href='/[^']*'" \
  -e 'router\.push(' \
  -e 'router\.replace(' \
  -e 'redirect(' \
  app/ components/ \
  2>/dev/null | \
  grep -v node_modules | \
  grep -v '.next' | \
  cut -d: -f1 | \
  sort -u | \
  while read -r file; do
    # Check if file already imports PATHS
    if ! grep -q "from '@/lib/paths'" "$file" 2>/dev/null; then
      echo "❌ $file"
    else
      echo "✅ $file (already has PATHS import)"
    fi
  done

echo ""
echo "=== Summary ==="
echo "Files marked with ❌ need to import PATHS"
echo "Files marked with ✅ already have PATHS imported"
