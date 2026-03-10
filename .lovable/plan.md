## Deep Audit: Incomplete Workflows Found

After a thorough E2E audit of the codebase, I identified **6 incomplete or broken workflows** across the system.

---

### Issue 1: TaskDialog `computeStatus` returns deprecated `'todo'` status (CRITICAL)

**File**: `src/components/workload/employee/TaskDialog.tsx` (line 72)

The `computeStatus()` function returns `'todo'` when progress is 0, but the DB trigger `validate_unified_task_status` **rejects** `'todo'` as invalid. This means updating a task with 0 progress will cause a database error.

**Fix**: Change the fallback from `'todo'` to `'open'` (or preserve the existing status if editing).

---

### Issue 2: BatchDetailDialog counts deprecated statuses `'done'` and `'todo'` (MEDIUM)

**File**: `src/components/workload/representative/BatchDetailDialog.tsx` (lines 41-44)

Counts tasks with `status === 'done'` and `status === 'todo'` — neither are valid statuses in the current lifecycle. These counts will always be 0, making the summary inaccurate.

**Fix**: Map `done` → `completed`, `todo` → `open`.

---

### Issue 3: workloadAnalytics uses deprecated `'done'` status (MEDIUM)

**Files**: `src/features/workload/hooks/useWorkloadAnalytics.ts` (lines 65-66), `src/pages/admin/RepresentativeWorkload.tsx` (line 101)

Both filter by `status === 'done'` which no longer exists. Completed tasks have `status === 'completed'`, so active/done counts are wrong.

**Fix**: Replace `'done'` with `'completed'` throughout.

---

### Issue 4: Admin Redemption Requests table missing Employee Name column (LOW)

**File**: `src/pages/admin/RedemptionManagement.tsx` (lines 139-168)

The requests log shows Date, Reward, Points, Status — but no employee name. Admin has no way to see **who** redeemed a reward. The `user_id` is available but not resolved to a name.

**Fix**: Join employees/profiles to resolve `user_id` → name, add an "Employee" column.

---

### Issue 5: Redemption email sender shows "Lovable" instead of tenant brand name (LOW)

**File**: `supabase/functions/send-redemption-email/index.ts` (line 71)

Hardcoded `from: "Lovable <onboarding@resend.dev>"`. Should use the tenant's brand name for a white-label experience. Same issue in `send-invitation-email`.

**Fix**: Accept tenant name as parameter and use it in the `from` field.

---

### Issue 6: Invitation language hardcoded to `'en'` (LOW)

**File**: `src/hooks/org/useTenantInvitations.ts` (line 115)

Comment says `// Todo: Pass this from input` — the language is always `'en'` regardless of the admin's current locale.

**Fix**: Pass `i18n.language` instead of hardcoded `'en'`.

---

### Implementation Plan

**Critical fix (Issue 1)**:

- `TaskDialog.tsx`: Change `computeStatus` to return current status or `'draft'` instead of `'todo'`

**Medium fixes (Issues 2-3)**:

- `BatchDetailDialog.tsx`: Replace `'done'` → `'completed'`, `'todo'` → `'open'`
- `useWorkloadAnalytics.ts`: Replace `'done'` → `'completed'`
- `RepresentativeWorkload.tsx`: Replace `'done'` → `'completed'`

**Low fixes (Issues 4-6)**:

- `RedemptionManagement.tsx`: Add employee name resolution query + column
- `useAdminRedemptionRequests`: Adjust select to join employee name
- `useTenantInvitations.ts`: Pass `i18n.language` for invitation email
- `send-redemption-email/index.ts`: Accept and use tenant name in sender

### Files to Modify

- `src/components/workload/employee/TaskDialog.tsx`
- `src/components/workload/representative/BatchDetailDialog.tsx`
- `src/features/workload/hooks/useWorkloadAnalytics.ts`
- `src/pages/admin/RepresentativeWorkload.tsx`
- `src/pages/admin/RedemptionManagement.tsx`
- `src/hooks/recognition/useRedemption.ts`
- `src/hooks/org/useTenantInvitations.ts`
- `supabase/functions/send-redemption-email/index.ts`