# Manual UI Test Plan - Sender Email Settings

## Prerequisites
- ✅ Dev server running on http://localhost:3002
- ✅ Logged in as user ID 3 (info@geebeat.com)
- ✅ At least one verified domain exists

## Test 1: Initial Page Load

### Steps:
1. Navigate to: http://localhost:3002/settings/sender-email
2. Observe the page loads

### Expected Results:
- ✅ Page loads without errors
- ✅ SettingsPageHeader displays: "Sender Email Settings"
- ✅ Description visible: "Configure the email address and name..."
- ✅ "About Sender Email" card is COLLAPSED (shows only title + chevron)
- ✅ "Verified Domains" card shows green checkmark with domain list
- ✅ Form section displays:
  - Input: "Sender Email Address" with current value
  - Input: "Sender Name (optional)" with current value
  - Preview card showing: "From: [Name] <[email]>"
- ✅ Buttons visible: "Clear" (if value exists) + "Save Settings"

---

## Test 2: Collapsible Info Card

### Steps:
1. Click on "About Sender Email" card header
2. Observe animation
3. Click again to collapse

### Expected Results:
- ✅ Card expands smoothly (height animation)
- ✅ Chevron rotates 180° when expanded
- ✅ Content visible: 3 bullet points about sender email
- ✅ Card collapses smoothly when clicked again
- ✅ Chevron rotates back to original position

---

## Test 3: Form Validation - Empty Email

### Steps:
1. Clear the "Sender Email Address" field
2. Click "Save Settings"

### Expected Results:
- ✅ Error message appears: "Sender email is required"
- ✅ Error displayed in red card below inputs
- ✅ Form does NOT submit
- ✅ No success message shown

---

## Test 4: Form Validation - Invalid Email Format

### Steps:
1. Enter invalid email: "notanemail"
2. Click "Save Settings"

### Expected Results:
- ✅ Error message appears: "Invalid email format"
- ✅ Error displayed in red card
- ✅ Form does NOT submit

---

## Test 5: Form Validation - Unverified Domain

### Steps:
1. Enter email with unverified domain: "test@unverified.com"
2. Click "Save Settings"

### Expected Results:
- ✅ Error message appears: 'Domain "unverified.com" is not verified...'
- ✅ Error displayed in red card
- ✅ Form does NOT submit

---

## Test 6: Successful Save - New Values

### Steps:
1. Enter valid sender email: "info@geebeat.com" (verified domain)
2. Enter sender name: "Test Artist"
3. Observe preview updates in real-time
4. Click "Save Settings"
5. Wait for response

### Expected Results:
- ✅ Preview shows: "From: Test Artist <info@geebeat.com>"
- ✅ "Save Settings" button shows loading state (spinner + "Saving...")
- ✅ Button is disabled during save
- ✅ Success message appears: "Settings saved!" (green badge with checkmark)
- ✅ Success message fades out after 3 seconds
- ✅ Form inputs remain filled with saved values
- ✅ No errors displayed

---

## Test 7: Persistence - Hard Reload

### Steps:
1. After successful save from Test 6
2. Press F5 or Cmd+R (hard reload)
3. Wait for page to load

### Expected Results:
- ✅ Page reloads completely
- ✅ "Sender Email Address" field shows: "info@geebeat.com"
- ✅ "Sender Name" field shows: "Test Artist"
- ✅ Preview shows: "From: Test Artist <info@geebeat.com>"
- ✅ Values persist (not reset to previous values)

---

## Test 8: Clear Functionality

### Steps:
1. With saved values visible
2. Click "Clear" button
3. Wait for response

### Expected Results:
- ✅ "Clear" button shows loading state
- ✅ Both buttons disabled during operation
- ✅ Success message appears
- ✅ Both input fields become empty
- ✅ Preview shows default: "From: The Backstage <noreply@thebackstage.app>"

---

## Test 9: Persistence After Clear - Reload

### Steps:
1. After clearing in Test 8
2. Press F5 or Cmd+R (hard reload)
3. Wait for page to load

### Expected Results:
- ✅ Page reloads
- ✅ Both input fields are empty
- ✅ Preview shows default sender
- ✅ Values remain cleared (not restored to previous)

---

## Test 10: Dark Mode Compatibility

### Steps:
1. Toggle dark mode (if theme switcher available)
2. Observe all components

### Expected Results:
- ✅ All cards adapt to dark theme
- ✅ Info card (blue) readable in dark mode
- ✅ Verified domains card (green) readable
- ✅ Inputs have dark background with light text
- ✅ Buttons maintain contrast
- ✅ Preview card readable
- ✅ No visual glitches or unreadable text

---

## Test 11: Error Recovery

### Steps:
1. Enter invalid email to trigger error
2. Observe error message
3. Correct the email to valid value
4. Click "Save Settings"

### Expected Results:
- ✅ Error message displayed initially
- ✅ After successful save, error message disappears
- ✅ Success message appears
- ✅ Form returns to normal state

---

## Test 12: State Synchronization (React Effect)

### Steps:
1. Save value: "info@geebeat.com" / "Artist A"
2. Wait for success
3. Edit fields to: "info@geebeat.com" / "Artist B"
4. Click "Save Settings"
5. Observe form after save

### Expected Results:
- ✅ After first save: inputs show "Artist A"
- ✅ After editing: inputs show "Artist B"
- ✅ After second save: inputs REMAIN "Artist B"
- ✅ useEffect syncs state with new props
- ✅ No flickering or reset to old values

---

## Test 13: Navigation Away and Back

### Steps:
1. Save a value
2. Navigate to another page (e.g., /settings/sending-domains)
3. Navigate back to /settings/sender-email

### Expected Results:
- ✅ Values are preserved
- ✅ No need to save again
- ✅ State matches database

---

## Database Verification (Optional)

After each save/clear operation, run:

```bash
node -r dotenv/config scripts/check-sender-email.js dotenv_config_path=.env.local
```

### Expected Results:
- ✅ Database values match UI values
- ✅ `updated_at` timestamp changes after each save

---

## Known Issues / Edge Cases

### Issue 1: Multiple Rapid Saves
**Steps:** Click "Save Settings" multiple times rapidly

**Expected Behavior:**
- ✅ Button should be disabled after first click
- ✅ Only one request should be sent
- ✅ No race conditions

### Issue 2: Network Failure
**Steps:** Save with network offline (DevTools → Network → Offline)

**Expected Behavior:**
- ✅ Error message: "An unexpected error occurred"
- ✅ Form remains in editable state
- ✅ User can retry

---

## Accessibility Checks (Optional)

1. ✅ All inputs have proper labels
2. ✅ Error messages are associated with inputs (aria-describedby)
3. ✅ Collapsible card has aria-expanded
4. ✅ Keyboard navigation works (Tab through all inputs/buttons)
5. ✅ Focus states visible on all interactive elements

---

## Performance Checks (Optional)

1. ✅ Page loads in <2 seconds
2. ✅ Save operation completes in <1 second
3. ✅ Animations are smooth (60fps)
4. ✅ No console errors or warnings
5. ✅ No unnecessary re-renders

---

## Summary Checklist

Run through all tests and mark:

- [ ] Test 1: Initial Page Load
- [ ] Test 2: Collapsible Info Card
- [ ] Test 3: Validation - Empty Email
- [ ] Test 4: Validation - Invalid Format
- [ ] Test 5: Validation - Unverified Domain
- [ ] Test 6: Successful Save
- [ ] Test 7: Persistence - Reload
- [ ] Test 8: Clear Functionality
- [ ] Test 9: Persistence After Clear
- [ ] Test 10: Dark Mode
- [ ] Test 11: Error Recovery
- [ ] Test 12: State Synchronization
- [ ] Test 13: Navigation

**All tests passing = ✅ Feature complete and production-ready**
