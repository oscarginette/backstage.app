# Branding Note: Gee Beat

## Brand Name

**Official Brand Name**: **Gee Beat**

**Technical Identifier**: `gee_beat` (lowercase, used in code/URLs/database)

---

## Usage Guidelines

### User-Facing Text (Use "Gee Beat")

- ✅ Email copy
- ✅ UI components (forms, buttons, labels)
- ✅ Privacy Policy
- ✅ Terms and Conditions
- ✅ Marketing materials
- ✅ Documentation visible to users

**Examples**:
```tsx
// ✅ CORRECT
<span>I accept emails from <strong>Gee Beat</strong></span>

// ❌ WRONG
<span>I accept emails from <strong>gee_beat</strong></span>
```

### Technical Code (Use "gee_beat" for values, "GeeBeat" for variables)

**String Values** (use `'gee_beat'`):
- ✅ Database values
- ✅ API parameters
- ✅ URL slugs
- ✅ Constant values

**Variable Names** (use `GeeBeat` in camelCase/PascalCase):
- ✅ Variable names: `consentGeeBeat`
- ✅ Constants: `DOWNLOAD_SOURCES.GEE_BEAT`
- ✅ Type properties: `acceptedGeeBeat`

**Examples**:
```typescript
// ✅ CORRECT - Constants
export const DOWNLOAD_SOURCES = {
  THE_BACKSTAGE: 'the_backstage' as const,
  GEE_BEAT: 'gee_beat' as const,  // ← Constant: GEE_BEAT, value: 'gee_beat'
} as const;

// ✅ CORRECT - Variables
interface FormData {
  consentGeeBeat: boolean;  // ← Variable name
}

// ✅ CORRECT - API/Database values
source: 'gee_beat'  // ← String value

// ❌ WRONG - Old naming
consentGbid: boolean  // Old
DOWNLOAD_SOURCES.GBID  // Old
source: 'gbid'  // Old
```

---

## Current Implementation Status

All updated to **"Gee Beat"** / **"gee_beat"** / **"GeeBeat"**:

- ✅ Constants: `DOWNLOAD_SOURCES.GEE_BEAT = 'gee_beat'`
- ✅ Variables: `consentGeeBeat: boolean`
- ✅ API values: `source: 'gee_beat'`
- ✅ UI labels: "I accept emails from **Gee Beat**"

---

## Quick Reference

| Context | Format | Example |
|---------|--------|---------|
| User sees it | **Gee Beat** | "I accept emails from **Gee Beat**" |
| Constant name | `GEE_BEAT` | `DOWNLOAD_SOURCES.GEE_BEAT` |
| Constant value | `'gee_beat'` | `'gee_beat' as const` |
| Variable name | `consentGeeBeat` | `consentGeeBeat: boolean` |
| API/DB value | `'gee_beat'` | `source: 'gee_beat'` |

---

*Last Updated: 2026-01-13*
