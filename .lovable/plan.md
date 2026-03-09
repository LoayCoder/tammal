

## Fix: Demographic Parity "not_evaluated"

### Root Cause
Two issues:

1. **Wrong column in employee lookup** — The edge function does `.from('employees').in('id', uniqueNomineeIds)` but `nominee_id` stores a **user_id**, not an employee ID. The lookup should use `.in('user_id', uniqueNomineeIds)` and key the map by `user_id`. This means the department data is never found, so parity defaults to the old "not_evaluated" behavior.

2. **Can't recalculate** — The cycle is already in `announced` status, but the edge function only allows recalculation from `voting` or `calculating`. The UI also only shows the "Calculate" button for those statuses. So even after fixing the code, old results can't be refreshed.

### Changes

**1. `supabase/functions/calculate-recognition-results/index.ts`**
- Line 79: Change `.in('id', uniqueNomineeIds)` → `.in('user_id', uniqueNomineeIds)`
- Line 79: Add `user_id` to the select: `select('user_id, department_id, departments:department_id(name)')`
- Lines 83-87: Key the `nomineeDeptMap` by `emp.user_id` instead of `emp.id`
- Line 48: Allow recalculation from `announced` status too: `['voting', 'calculating', 'announced']`

**2. `src/pages/admin/RecognitionResults.tsx`**
- Line 85: Show the "Calculate" button for `announced` cycles too so admins can recalculate with the fixed logic

