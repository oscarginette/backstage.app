# Contact Date Import Feature

## Overview

The contact import system now supports automatic detection and parsing of date columns, including **relative dates** like "7 months ago", "25 days ago", etc.

When a contact is imported with a date column (e.g., "Contact Since", "Created", "Joined"), the system:
1. Automatically detects the date column
2. Parses the date (supports multiple formats)
3. Sets the `created_at` field in the database

## Supported Date Formats

### 1. Relative Dates (Human-Readable)

**Examples:**
- `7 months ago`
- `25 days ago`
- `3 years ago`
- `2 weeks ago`
- `1 month ago` (singular)

**Use Case:** Common in exports from platforms like Brevo, Mailchimp, where dates are displayed relative to export time.

### 2. ISO Dates

**Examples:**
- `2024-01-15`
- `2023-12-25`
- `2024/03/10` (slash format)

### 3. Standard Dates

**Examples:**
- `01/15/2024` (MM/DD/YYYY - US format)
- `15-01-2024` (attempts DD-MM-YYYY)

### 4. JavaScript Date Strings

Any valid JavaScript date string is accepted as a fallback.

## Auto-Detection of Date Columns

The system automatically detects columns with date-related keywords:

**Detected Keywords:**
- `date`
- `created`
- `added`
- `joined`
- `since`
- `signup`
- `registered`
- `subscribed_at`
- `created_at`
- `timestamp`
- `time`

**Priority Order:**
1. `created_at` (highest priority)
2. `created`
3. `date_created`
4. `contact_since` / `contactsince`
5. `since`
6. `joined`
7. `date_joined`
8. `signup_date`
9. `subscribed_at`
10. Any column containing date keywords

## Example CSV Import

### Example 1: Relative Dates (Brevo Export)

```csv
Email,Name,Contact Since,Subscribed
john@example.com,John Doe,7 months ago,true
jane@example.com,Jane Smith,25 days ago,true
bob@example.com,Bob Wilson,3 years ago,false
```

**Result:**
- John's `created_at`: ~7 months before import date
- Jane's `created_at`: ~25 days before import date
- Bob's `created_at`: ~3 years before import date

### Example 2: ISO Dates

```csv
Email,Name,Created,Subscribed
john@example.com,John Doe,2024-01-15,true
jane@example.com,Jane Smith,2024-06-10,true
```

**Result:**
- John's `created_at`: 2024-01-15 00:00:00
- Jane's `created_at`: 2024-06-10 00:00:00

### Example 3: Mixed Formats

```csv
Email,Name,Joined,Subscribed
john@example.com,John Doe,7 months ago,true
jane@example.com,Jane Smith,2024-06-10,true
bob@example.com,Bob Wilson,01/15/2024,true
```

**Result:** All dates parsed correctly according to their format.

## Database Behavior

### New Contacts
When inserting a new contact:
- If `created_at` is parsed from CSV → uses parsed date
- If no date column found → uses `CURRENT_TIMESTAMP`

### Existing Contacts (Updates)
When updating an existing contact via import:
- **Preserves original `created_at`** (doesn't overwrite)
- Uses `COALESCE(contacts.created_at, EXCLUDED.created_at)`

This ensures that re-importing contacts doesn't change their original creation date.

## Technical Implementation

### Architecture (Clean Architecture + SOLID)

**Domain Layer:**
- `domain/utils/date-parser.ts` - Pure date parsing functions
- `domain/entities/ImportedContact.ts` - Added optional `createdAt` field
- `domain/services/ValidateImportDataUseCase.ts` - Auto-detects and extracts dates

**Infrastructure Layer:**
- `infrastructure/database/repositories/PostgresContactRepository.ts` - Inserts `created_at`

**Interface:**
- `domain/repositories/IContactRepository.ts` - Added `createdAt` to `BulkImportContactInput`

### Date Parser Functions

**`parseDate(value: string | Date | null | undefined): Date | null`**
- Main parser
- Tries all formats in priority order
- Returns `Date` object or `null`

**`parseRelativeDate(value: string): Date | null`**
- Parses "X days/weeks/months/years ago"
- Calculates date relative to current time

**`parseISODate(value: string): Date | null`**
- Parses ISO 8601 dates (YYYY-MM-DD)

**`isDateColumn(columnName: string): boolean`**
- Detects if column name suggests date content

## Edge Cases & Validation

### Invalid Dates
- Invalid dates return `null` → uses `CURRENT_TIMESTAMP`
- Example: "Feb 31" → `null`

### Ambiguous Dates
- MM/DD/YYYY vs DD/MM/YYYY → assumes US format (MM/DD/YYYY)
- To avoid ambiguity, use ISO format (YYYY-MM-DD)

### Year Range Validation
- Accepts years: 1900-2100
- Outside range → `null`

### Metadata Preservation
Original date values (e.g., "7 months ago") are **preserved in metadata** for reference.

## Testing

### Unit Tests
Run: `npm run test:run domain/utils/__tests__/date-parser.test.ts`

**Coverage:**
- ✅ Relative date parsing
- ✅ ISO date parsing
- ✅ Standard date formats
- ✅ Invalid date handling
- ✅ Column name detection

### Manual Testing

1. Create test CSV:
```csv
Email,Name,Contact Since
test1@example.com,Test User 1,7 months ago
test2@example.com,Test User 2,2024-01-15
test3@example.com,Test User 3,01/15/2024
```

2. Import via Dashboard → Import Contacts
3. Verify `created_at` in database:
```sql
SELECT email, name, created_at
FROM contacts
WHERE email LIKE 'test%@example.com'
ORDER BY created_at;
```

## Limitations

1. **Relative dates are approximate**
   - "7 months ago" = exactly 7 months, but month lengths vary
   - For precise dates, use ISO format

2. **Timezone handling**
   - Dates parsed as UTC midnight (00:00:00)
   - No timezone information preserved

3. **Date-only (no time)**
   - Time component always 00:00:00
   - Full datetime support not implemented

## Future Enhancements

- [ ] Support for datetime with time component
- [ ] Timezone support
- [ ] More relative formats ("last week", "yesterday")
- [ ] Custom date format specification in UI
- [ ] Date validation warnings in preview step

---

**Related Files:**
- `domain/utils/date-parser.ts`
- `domain/services/ValidateImportDataUseCase.ts`
- `infrastructure/database/repositories/PostgresContactRepository.ts`

**Related Issues:**
- Contact import constraint fix (2026-01-09)
