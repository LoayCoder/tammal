

# Deep Audit & Fix Plan: Mood Pathway Settings (`/admin/mood-pathways`)

## Issues Found

### 1. Delete Button Never Visible (Critical)
All 5 moods in the database have `is_default: true`. The delete button is conditionally rendered with `{!mood.is_default && (...)}`, so it never appears for any mood. The user cannot delete any mood -- even custom ones added later would work, but the 5 seeded defaults cannot.

**Fix**: Allow deleting default moods too (with a confirmation warning), OR at minimum ensure the delete button works. The reasonable approach: allow deletion of ALL moods except protect a minimum count (e.g., at least 2 must remain). Remove the `is_default` guard from the delete button and add a minimum-count check instead.

### 2. Emoji Uniqueness Not Enforced in `canSave` (Bug)
The dialog checks `takenEmojis` for display purposes and shows a warning message, but `canSave` on line 76 does NOT prevent saving when the emoji is already taken. A user can type a duplicate emoji in the custom input and still save.

**Fix**: Add `!(takenEmojis.has(emoji) && emoji !== mood?.emoji)` to the `canSave` condition.

### 3. Score/Color Uniqueness Not Enforced in `canSave` (Bug)
Similarly, taken scores and colors are hidden from selection dropdowns, but not validated. If the current value happens to match a taken value (e.g., during editing edge cases or when all options are taken), the form still allows saving.

**Fix**: Add score and color uniqueness checks to `canSave`.

### 4. RTL Violation: `mx-auto` (Design System Rule)
Line 376 uses `mx-auto` which violates the "logical properties" rule. Should not use `ml-`/`mr-`/`mx-` classes.

**Fix**: Replace `mx-auto` with `inline-block` + `text-center` on parent (already has `text-center`), or keep it since `mx-auto` is symmetric and technically safe. However, per strict rules, it should be noted.

### 5. Console Warning: DialogFooter Ref
A React warning shows `Function components cannot be given refs` from `MoodDefinitionDialog`. This is a Radix/Shadcn issue with `DialogFooter` not using `forwardRef`.

**Fix**: Minor -- no functional impact, but wrapping or ignoring is fine.

### 6. Edit Mode: Current Values Hidden from Dropdowns
When editing a mood, if that mood's current color/score/emoji are already "taken" by itself, they get filtered out. The code does `otherMoods = existingMoods.filter(m => !mood || m.id !== mood.id)` which correctly excludes the current mood. This should work -- but only if `mood.id` is present and matches. If the upsert uses `onConflict: 'tenant_id,key'` without passing `id`, the ID comparison may fail.

**Fix**: Verify the edit flow passes `mood.id` correctly (it does on line 80).

### 7. Two Default Moods Share Same Color (`text-destructive`)
"Struggling" and "Need Help" both use `text-destructive`, but the deduplication logic hides taken colors. When one is being edited, the other's color blocks `text-destructive` from the dropdown. This means you cannot keep both on `text-destructive` after editing either one.

**Fix**: The color dedup should be relaxed or more color options added. Add more color variants to `COLOR_OPTIONS`.

---

## Implementation Plan

### Step 1: Fix Delete Feature
- Remove the `!mood.is_default` guard from the delete button in `MoodPathwaySettings.tsx`
- Add a minimum-count check: disable delete if `moods.length <= 2` (must keep at least 2 moods)
- Add an `AlertDialog` confirmation instead of `window.confirm()` for better UX and RTL support

### Step 2: Fix Validation in MoodDefinitionDialog
- Update `canSave` to block saving when emoji is duplicated
- Add score and color uniqueness to `canSave`
- Show inline validation messages for score and color conflicts (not just emoji)

### Step 3: Fix Color Duplication Issue
- Add more `COLOR_OPTIONS` to ensure enough choices (e.g., `text-orange-500`, `text-teal-500`, `text-indigo-500`)
- Allow duplicate colors with a soft warning instead of hiding them

### Step 4: Fix RTL Violation
- Replace `mx-auto` with a logical-property-safe alternative

### Step 5: Add Missing i18n Keys
- Add keys for new validation messages and delete confirmation dialog

---

## Technical Details

**Files to modify:**
- `src/pages/admin/MoodPathwaySettings.tsx` -- delete button guard, AlertDialog, RTL fix
- `src/components/mood/MoodDefinitionDialog.tsx` -- validation fixes, more colors
- `src/locales/en.json` -- new keys
- `src/locales/ar.json` -- new keys

