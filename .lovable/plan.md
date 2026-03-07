

# Nominee Manager Approval for Nominations

## Concept

When a nomination is submitted, the **nominee's direct manager** must approve it before it can proceed to voting. This requirement is **linked to the "Allow Appeals" toggle** in the cycle's fairness config:

- **Allow Appeals = ON** → Nominee's manager must approve the nomination (status goes `submitted → pending_manager_approval → endorsed`)
- **Allow Appeals = OFF** → No manager approval needed (nomination proceeds as-is)

## Database Changes

### 1. New column on `nominations` table
```sql
ALTER TABLE nominations ADD COLUMN manager_approval_status TEXT DEFAULT 'not_required';
ALTER TABLE nominations ADD COLUMN manager_approved_by UUID REFERENCES auth.users(id);
ALTER TABLE nominations ADD COLUMN manager_approval_at TIMESTAMPTZ;
ALTER TABLE nominations ADD COLUMN manager_rejection_reason TEXT;
```

Valid values for `manager_approval_status`: `not_required`, `pending`, `approved`, `rejected`

### 2. Validation trigger
```sql
CREATE FUNCTION validate_manager_approval_status() ...
-- Validates: not_required, pending, approved, rejected
```

### 3. Update nomination status validation
Add `pending_manager_approval` to the allowed nomination statuses in `validate_nomination_status()`.

## Hook Changes

### `src/hooks/recognition/useNominations.ts`
- In `createNomination`: Check if the cycle has `allowAppeals` enabled. If yes, set `manager_approval_status = 'pending'`; otherwise set `not_required`.
- Add new `useManagerApprovals()` hook or extend existing hook:
  - Query nominations where current user is the manager of the nominee (join `employees` table where `manager_id` = current employee and nominee's `user_id` matches)
  - `approveNomination` mutation: updates `manager_approval_status` to `approved`, sets `manager_approved_by` and `manager_approval_at`
  - `rejectNomination` mutation: updates to `rejected` with reason

### New hook: `src/hooks/recognition/useNominationApprovals.ts`
- Fetches nominations pending manager approval where the current user is the nominee's manager
- Provides approve/reject mutations
- Invalidates nomination queries on success

## UI Changes

### 1. Manager Approval Dashboard
New page or tab at `/recognition/approvals` (or within `/recognition/nominations`):
- Lists all nominations where the logged-in user is the nominee's manager and `manager_approval_status = 'pending'`
- Each card shows: nominee name, nominator, theme, headline, justification
- Actions: **Approve** button, **Reject** button (with reason dialog)

### 2. `NominationCard.tsx`
- Add a new badge for `manager_approval_status` (pending/approved/rejected)
- Show rejection reason if rejected

### 3. `RecognitionResults.tsx` / Voting flow
- Nominations with `manager_approval_status = 'rejected'` are excluded from voting
- Nominations with `manager_approval_status = 'pending'` show a warning that they're awaiting approval

### 4. Nomination submission flow (`NominatePage.tsx`)
- After submitting, if appeals are enabled, show a message: "This nomination requires manager approval before proceeding"

## Localization Keys (en.json / ar.json)
- `recognition.nominations.managerApproval` — "Manager Approval"
- `recognition.nominations.pendingManagerApproval` — "Pending Manager Approval"
- `recognition.nominations.managerApproved` — "Manager Approved"
- `recognition.nominations.managerRejected` — "Manager Rejected"
- `recognition.nominations.rejectionReason` — "Rejection Reason"
- `recognition.nominations.approveNomination` — "Approve"
- `recognition.nominations.rejectNomination` — "Reject"
- `recognition.nominations.requiresManagerApproval` — "This nomination requires approval from the nominee's manager"

## Logic Summary

```text
Nomination Submitted
        │
        ├── allowAppeals = false → manager_approval_status = 'not_required' → proceeds normally
        │
        └── allowAppeals = true  → manager_approval_status = 'pending'
                                        │
                                        ├── Manager approves → 'approved' → eligible for voting
                                        └── Manager rejects  → 'rejected' → excluded from voting
```

## Files to Create/Modify

| File | Action |
|---|---|
| DB migration | Add `manager_approval_status`, `manager_approved_by`, `manager_approval_at`, `manager_rejection_reason` columns + validation trigger |
| `src/hooks/recognition/useNominationApprovals.ts` | **Create** — manager approval queries & mutations |
| `src/hooks/recognition/useNominations.ts` | **Modify** — set `manager_approval_status` on create based on cycle config |
| `src/components/recognition/NominationCard.tsx` | **Modify** — show manager approval badge |
| `src/components/recognition/ManagerApprovalCard.tsx` | **Create** — card with approve/reject actions |
| `src/pages/recognition/NominationApprovalsPage.tsx` | **Create** — manager approval dashboard |
| `src/locales/en.json` & `ar.json` | **Modify** — add approval-related keys |
| Routing config | **Modify** — add route for approvals page |

