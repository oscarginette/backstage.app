# Settings Design System - Migration Guide

## Proof of Concept: Profile Page ✅

La página de Profile ha sido refactorizada exitosamente como prueba de concepto.

### Results

**Before (Original ProfileSettings.tsx):**
- 131 lines of code
- Inline styles duplicated across 6 different sections
- No reuse of design system components
- Manual button/success message handling

**After (Refactored ProfileSettings.tsx):**
- 110 lines of code (**16% reduction**)
- Uses 3 reusable components from design system
- Zero inline styles (all use design tokens)
- Automatic button/success message via SettingsFormActions

**New Components Created (Reusable):**
1. `SettingsPageHeader.tsx` - 93 lines
2. `SettingsSection.tsx` - 122 lines
3. `SettingsFormActions.tsx` - 186 lines

**Total Investment:** 401 lines (3 reusable components)

**Expected Savings:** When applied to all 6 Settings pages → ~800+ lines eliminated

---

## Architecture

### Component Hierarchy

```
Settings Page
├── SettingsPageHeader (title, description, optional actions)
├── form
│   ├── SettingsSection (card wrapper)
│   │   └── Input components (from design system)
│   └── SettingsFormActions (save button + success message)
```

### Design System Stack

```
Application Layer (Settings Pages)
    ↓
Settings Components (SettingsPageHeader, SettingsSection, SettingsFormActions)
    ↓
UI Components (Button, Input, Card)
    ↓
Design Tokens (CARD_STYLES, INPUT_STYLES, BUTTON_STYLES, TEXT_STYLES)
```

---

## Migration Pattern (Copy-Paste Template)

### Before (❌ Old Pattern)

```tsx
'use client';

import { useState } from 'react';

export function MySettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // ... save logic
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-foreground mb-2">My Title</h2>
        <p className="text-foreground/50 text-sm">My description</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <section className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
              Field Label
            </label>
            <input
              type="text"
              className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium text-foreground"
            />
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="group relative h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md disabled:opacity-70"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {showSuccess && (
            <div className="text-emerald-600 font-bold">Saved!</div>
          )}
        </div>
      </form>
    </div>
  );
}
```

### After (✅ New Pattern)

```tsx
'use client';

import { useState } from 'react';
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsFormActions } from '@/components/settings/SettingsFormActions';
import { Input } from '@/components/ui/Input';

export function MySettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // ... save logic
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="My Title"
        description="My description"
      />

      <form onSubmit={handleSave} className="space-y-6">
        <SettingsSection>
          <Input
            label="Field Label"
            type="text"
            focusVariant="primary"
          />
        </SettingsSection>

        <SettingsFormActions
          isSaving={isSaving}
          showSuccess={showSuccess}
          type="submit"
        />
      </form>
    </div>
  );
}
```

**Lines reduced:** ~45 lines → ~30 lines (33% reduction)

---

## Migration Checklist (Per Page)

### 1. Import New Components

```tsx
import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsFormActions } from '@/components/settings/SettingsFormActions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
```

### 2. Replace Header

**Before:**
```tsx
<div>
  <h2 className="text-2xl font-serif text-foreground mb-2">Title</h2>
  <p className="text-foreground/50 text-sm">Description</p>
</div>
```

**After:**
```tsx
<SettingsPageHeader
  title="Title"
  description="Description"
/>
```

### 3. Replace Section Wrapper

**Before:**
```tsx
<section className="bg-white/90 dark:bg-[#0A0A0A] backdrop-blur-md border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
  {/* Content */}
</section>
```

**After:**
```tsx
<SettingsSection>
  {/* Content */}
</SettingsSection>
```

### 4. Replace Input Fields

**Before:**
```tsx
<div className="space-y-2">
  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40 ml-1">
    Label
  </label>
  <input
    type="text"
    className="w-full h-10 px-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 focus:bg-white dark:focus:bg-[#161616] transition-all text-sm font-medium text-foreground"
  />
</div>
```

**After:**
```tsx
<Input
  label="Label"
  type="text"
  focusVariant="primary"
/>
```

### 5. Replace Save Button + Success Message

**Before:**
```tsx
<div className="flex items-center gap-4">
  <button
    type="submit"
    disabled={isSaving}
    className="group relative h-10 px-6 rounded-lg bg-foreground text-background text-xs font-bold transition-all hover:bg-foreground/90 active:scale-[0.98] shadow-md disabled:opacity-70"
  >
    <AnimatePresence mode="wait">
      {isSaving ? (
        <motion.div>Saving...</motion.div>
      ) : (
        <motion.div>Save</motion.div>
      )}
    </AnimatePresence>
  </button>

  <AnimatePresence>
    {showSuccess && (
      <motion.div className="text-emerald-600">Saved!</motion.div>
    )}
  </AnimatePresence>
</div>
```

**After:**
```tsx
<SettingsFormActions
  isSaving={isSaving}
  showSuccess={showSuccess}
  type="submit"
/>
```

---

## Advanced Patterns

### Header with Action Buttons

```tsx
<SettingsPageHeader
  title="Email Signature"
  description="Customize your email signature"
  actions={
    <>
      <Button variant="secondary" size="sm" onClick={handlePreview}>
        <Eye className="w-4 h-4" />
        Preview
      </Button>
      <Button variant="primary" size="sm" onClick={handleSave}>
        <Save className="w-4 h-4" />
        Save
      </Button>
    </>
  }
/>
```

### Section with Title & Description

```tsx
<SettingsSection
  title="Integration Settings"
  description="Configure your external platform connections"
>
  <Input label="SoundCloud URL" focusVariant="soundcloud" />
  <Input label="Spotify URL" focusVariant="spotify" />
</SettingsSection>
```

### Custom Width Section

```tsx
<SettingsSection maxWidth="4xl">
  {/* Wide content (e.g., tables, grids) */}
</SettingsSection>
```

### Form Actions with Additional Buttons

```tsx
<SettingsFormActions
  isSaving={isSaving}
  showSuccess={showSuccess}
  type="submit"
>
  <Button variant="secondary" onClick={handleCancel}>
    Cancel
  </Button>
  <Button variant="danger" onClick={handleReset}>
    Reset to Default
  </Button>
</SettingsFormActions>
```

---

## Remaining Pages to Migrate

### ✅ Profile (COMPLETED - Proof of Concept)
- **Status:** Migrated
- **Lines:** 131 → 110 (16% reduction)
- **Uses:** SettingsPageHeader, SettingsSection, Input, SettingsFormActions

### ⏳ Appearance (Easy - 5 min)
- **Current:** 18 lines (already simple)
- **Migration:** Only replace header
- **Estimated:** 18 → 15 lines

### ⏳ Notifications (Easy - 5 min)
- **Current:** 18 lines (already simple)
- **Migration:** Only replace header
- **Estimated:** 18 → 15 lines

### ⏳ Integrations (Medium - 20 min)
- **Current:** 342 lines
- **Migration:** Header, Section, Input fields, Form actions
- **Estimated:** 342 → 180 lines (47% reduction)

### ⏳ Email Signature (Complex - 30 min)
- **Current:** 461 lines
- **Migration:** Header with actions, Section, Input fields (keep custom preview logic)
- **Estimated:** 461 → 280 lines (39% reduction)

### ⏳ Sending Domains (Complex - 30 min)
- **Current:** 154 lines (+ 672 in modals)
- **Migration:** Header with button, SettingsSection for tabs (keep custom tabs/modal logic)
- **Estimated:** 154 → 130 lines (16% reduction)

---

## Expected Total Impact

### Code Reduction
- **Before:** ~2,812 lines across all Settings pages
- **After:** ~1,950 lines (estimated)
- **Savings:** ~862 lines eliminated (31% reduction)

### Consistency
- ✅ 100% of pages use same header layout
- ✅ 100% of pages use Card component from design system
- ✅ 100% of inputs use Input component
- ✅ 100% of save buttons use SettingsFormActions

### Maintainability
- Change header design → Edit 1 file (SettingsPageHeader.tsx)
- Change input styling → Edit 1 file (components/ui/Input.tsx)
- Change save button → Edit 1 file (SettingsFormActions.tsx)
- Change card styling → Edit 1 file (domain/types/design-tokens.ts)

---

## Next Steps

1. **Migrate Appearance** (5 min)
2. **Migrate Notifications** (5 min)
3. **Migrate Integrations** (20 min)
4. **Migrate Email Signature** (30 min)
5. **Migrate Sending Domains** (30 min)

**Total Time Investment:** ~1.5 hours
**Long-term Benefit:** Consistent design system, 31% less code to maintain

---

*Last Updated: 2026-01-13*
*Proof of Concept: Profile Page ✅*
