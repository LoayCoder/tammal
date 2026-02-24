

# Fix: Survey Submission Unique Constraint Violation

## Root Cause

The unique index `idx_employee_responses_unique_active` on the `employee_responses` table is defined as:

```text
UNIQUE (scheduled_question_id, employee_id) WHERE (scheduled_question_id IS NOT NULL)
```

This index does **not** exclude soft-deleted rows. The current bulk submission logic soft-deletes old responses (sets `deleted_at`), then inserts new ones. But because the index still sees soft-deleted rows, the insert fails with a duplicate key violation.

## Fix

Recreate the unique index to only cover **active** (non-deleted) rows by adding `AND deleted_at IS NULL` to the index condition.

### Step 1: Database Migration

Drop and recreate the unique index with the correct partial filter:

```sql
DROP INDEX IF EXISTS idx_employee_responses_unique_active;
CREATE UNIQUE INDEX idx_employee_responses_unique_active 
  ON public.employee_responses (scheduled_question_id, employee_id) 
  WHERE (scheduled_question_id IS NOT NULL AND deleted_at IS NULL);
```

This is the only change needed. Once the index correctly excludes soft-deleted rows, the existing soft-delete-then-insert logic in the `submit-response` edge function will work as intended.

### No code changes required

The edge function already:
1. Soft-deletes all existing responses for the target scheduled questions
2. Inserts fresh response rows

This flow is correct -- only the database index definition was wrong.

## Impact

- Fixes the 500 error when submitting surveys
- No data loss (existing soft-deleted rows remain untouched)
- No edge function redeployment needed

