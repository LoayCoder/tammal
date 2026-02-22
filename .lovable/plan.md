

# Generation Period: One-Active-Per-Purpose Enforcement

## Current State

- The `generation_periods` table has no `purpose` column -- all periods are purpose-agnostic
- No validation prevents creating multiple active periods
- The Generate button is not locked when an active period exists
- The `CreatePeriodDialog` has no purpose awareness

## Changes Required

### 1. Database Migration: Add `purpose` Column + Unique Constraint

Add a `purpose` column (`text NOT NULL DEFAULT 'survey'`) to `generation_periods` and create a partial unique index ensuring only one active period per purpose per tenant:

```sql
ALTER TABLE generation_periods ADD COLUMN purpose text NOT NULL DEFAULT 'survey';

CREATE UNIQUE INDEX idx_one_active_period_per_purpose
  ON generation_periods (tenant_id, purpose)
  WHERE status = 'active' AND deleted_at IS NULL;
```

This database-level constraint guarantees the rule cannot be bypassed.

### 2. Update `useGenerationPeriods` Hook

- Add `purpose` to the `GenerationPeriod` interface
- Add a `getActivePeriodForPurpose(purpose)` helper that returns the active period for a given purpose (or `null`)
- Before creating, check for an existing active period for the same purpose -- show a clear translated error toast if one exists
- Add a `softDeletePeriod` mutation to set `deleted_at = now()` (allowing a new period to be created)
- Add an `expirePeriod` mutation to set `status = 'expired'`

### 3. Update `CreatePeriodDialog`

- Accept a new `purpose` prop (passed from `ConfigPanel`)
- Accept an `activePeriodForPurpose` prop -- if one exists, show an Alert banner explaining a period is already active, with its date range, and disable the Create button
- Pass the `purpose` value in `onConfirm` params so it gets saved to the database

### 4. Update `ConfigPanel`

- Pass `purpose` to `CreatePeriodDialog`
- Filter the period dropdown to only show periods matching the current purpose
- Compute `activePeriodForPurpose` and pass to `CreatePeriodDialog`
- When an active period exists for the selected purpose:
  - Auto-select it in the period dropdown
  - Show a lock indicator with "Active period in effect" message
  - Disable the Generate button with a tooltip explaining the lock
- Add a "Manage Period" action (soft-delete or expire) to unlock generation

### 5. Update `AIQuestionGenerator` Page

- Pass `purpose` through to `createPeriod` call so it gets stored
- When purpose changes, check if the new purpose has an active period and auto-select it

### 6. Translation Keys (en.json + ar.json)

New keys:
- `aiGenerator.periodAlreadyActive` -- "An active generation period already exists for this purpose"
- `aiGenerator.periodActiveInfo` -- "Active period: {{start}} to {{end}}"
- `aiGenerator.periodExpire` -- "Expire Period"
- `aiGenerator.periodDelete` -- "Delete Period"
- `aiGenerator.periodLockedGenerate` -- "Generation is locked while a period is active"
- `aiGenerator.periodExpired` -- "Period expired successfully"
- `aiGenerator.periodDeleted` -- "Period deleted successfully"
- `aiGenerator.periodPurposeSurvey` -- "Survey"
- `aiGenerator.periodPurposeWellness` -- "Daily Check-in"

## Technical Details

### File changes:
1. **New migration** -- adds `purpose` column + partial unique index
2. **`src/hooks/useGenerationPeriods.ts`** -- add `purpose` field, `softDeletePeriod`, `expirePeriod`, `getActivePeriodForPurpose`
3. **`src/components/ai-generator/CreatePeriodDialog.tsx`** -- add `purpose` prop, active-period warning Alert, disable Create when active
4. **`src/components/ai-generator/ConfigPanel.tsx`** -- filter periods by purpose, auto-select active, lock Generate button, add expire/delete actions
5. **`src/pages/admin/AIQuestionGenerator.tsx`** -- pass `purpose` to `createPeriod`, react to purpose changes
6. **`src/locales/en.json`** -- new translation keys
7. **`src/locales/ar.json`** -- new Arabic translation keys

### Flow Summary

```text
User selects Purpose (Survey/Wellness)
  |
  +--> Check: active period exists for this purpose?
  |      |
  |      YES --> Auto-select period, lock categories, lock Generate button
  |      |       Show: "Active period until {date}" with Expire/Delete options
  |      |
  |      NO  --> Generator unlocked, user can generate freely
  |              User can optionally create a new period
  |
  +--> User clicks "Create Period"
         |
         +--> Active period exists? --> Show error Alert, disable Create
         +--> No active period? --> Allow creation with purpose tag
```

