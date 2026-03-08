

## Plan: Handle Nominations When Nominee Has No Manager

### Problem
When a cycle has manager approval enabled ("Allow Appeals") and the nominee has no `manager_id` in the `employees` table, the nomination is created with `manager_approval_status: 'pending'` but no one can approve it — it's orphaned forever.

### Proposed Solution
Auto-approve nominations when the nominee has no manager assigned. This is the least disruptive approach — the nomination proceeds normally rather than being blocked.

### Changes

**`src/hooks/recognition/useNominations.ts`** (in `createNomination` mutation)
- After determining `allowAppeals` is true, check if the nominee has a `manager_id` in the `employees` table
- If no manager exists, set `manager_approval_status: 'not_required'` instead of `'pending'`
- This way the nomination skips the approval gate and proceeds to the endorsement flow

**`src/components/recognition/NominationWizard.tsx`**
- In the review step, if `allowAppeals` is true but the nominee has no manager, show an info note: "This nominee has no manager assigned — manager approval will be skipped"
- Update the `managerApprovalPending` state based on the actual result

### Technical detail
```
// In createNomination mutationFn:
// 1. Check nominee's manager
const { data: nomineeEmp } = await supabase
  .from('employees')
  .select('manager_id')
  .eq('user_id', nomineeId)
  .is('deleted_at', null)
  .maybeSingle();

const hasManager = !!nomineeEmp?.manager_id;
const approvalStatus = (allowAppeals && hasManager) ? 'pending' : 'not_required';
```

### No database changes needed.

