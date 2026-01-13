#!/bin/bash

# Script to update error class definitions in use cases
# Replaces inline error class definitions with imports from @/lib/errors

set -e

FILES=(
  "domain/services/UploadCoverImageUseCase.ts"
  "domain/services/SendDraftUseCase.ts"
  "domain/services/email-templates/CreateEmailTemplateUseCase.ts"
  "domain/services/UpdateUserSettingsUseCase.ts"
  "domain/services/CreateEmailTemplateUseCase.ts"
  "domain/services/SendCustomEmailUseCase.ts"
  "domain/services/SendTestEmailUseCase.ts"
  "domain/services/SaveDraftUseCase.ts"
  "domain/services/admin/GetAllUsersUseCase.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Check if file has inline ValidationError definition
    if grep -q "^export class ValidationError extends Error" "$file"; then
      # Create temp file
      tmpfile=$(mktemp)

      # Remove the inline ValidationError class (lines containing the class definition)
      sed '/^export class ValidationError extends Error/,/^}/d' "$file" > "$tmpfile"

      # Check if file already has import from @/lib/errors
      if ! grep -q "from '@/lib/errors'" "$tmpfile"; then
        # Find the last import line and add our import after it
        awk '/^import .*from/ {last_import=NR} {lines[NR]=$0} END {
          for(i=1; i<=NR; i++) {
            print lines[i];
            if(i==last_import) {
              print "import { ValidationError } from '\''@/lib/errors'\'';"
            }
          }
        }' "$tmpfile" > "$tmpfile.2"
        mv "$tmpfile.2" "$tmpfile"
      else
        # Import already exists, just update it to include ValidationError if needed
        if ! grep -q "ValidationError" "$tmpfile" | grep "@/lib/errors"; then
          sed -i.bak "s/from '@\/lib\/errors'/ValidationError } from '@\/lib\/errors'/" "$tmpfile"
          rm "$tmpfile.bak" 2>/dev/null || true
        fi
      fi

      # Replace original file
      mv "$tmpfile" "$file"
      echo "  ✓ Updated ValidationError import"
    fi

    # Check if file has inline UnauthorizedError definition
    if grep -q "^export class UnauthorizedError extends Error" "$file"; then
      tmpfile=$(mktemp)
      sed '/^export class UnauthorizedError extends Error/,/^}/d' "$file" > "$tmpfile"

      # Add import
      if ! grep -q "UnauthorizedError.*from '@/lib/errors'" "$tmpfile"; then
        sed -i.bak "s/from '@\/lib\/errors'/UnauthorizedError } from '@\/lib\/errors'/" "$tmpfile" 2>/dev/null || \
        awk '/^import .*from/ {last_import=NR} {lines[NR]=$0} END {
          for(i=1; i<=NR; i++) {
            print lines[i];
            if(i==last_import) {
              print "import { UnauthorizedError } from '\''@/lib/errors'\'';"
            }
          }
        }' "$tmpfile" > "$tmpfile.2" && mv "$tmpfile.2" "$tmpfile"
        rm "$tmpfile.bak" 2>/dev/null || true
      fi

      mv "$tmpfile" "$file"
      echo "  ✓ Updated UnauthorizedError import"
    fi
  fi
done

echo ""
echo "✓ All use case error imports updated"
