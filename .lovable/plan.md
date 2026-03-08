

# End-to-End Nomination Workflow Audit

## Current Database State (Live Data)

```text
CYCLE:   "Code Crafter" (status: nominating)
         allowAppeals: TRUE (in fairness_config.auditSettings)

THEMES:  "Award Themes 01" (2 criteria: Innovation 25%, Teamwork 75%)
         "Award Themes 02" (0 criteria)

EMPLOYEES (3 total):
  Test User      → manager: LUAY
  Abdullah        → manager: LUAY
  LUAY           → manager: none

NOMINATIONS (1):
  "Test n0.1" by Test User → nominee Abdullah
  status: submitted
  manager_approval_status: not_required  ← BUG (should be "pending")
  endorsement_status: pending

ENDORSEMENT REQUESTS: 0 (never created)
RECOGNITION NOTIFICATIONS: 0
PEER ENDORSEMENTS: 0
VOTES: 0
```

---

## Bugs Found (7 issues)

### BUG 1 — CRITICAL: `allowAppeals` never passed to mutation
**Location**: `NominationWizard.tsx` line 94
**Problem**: The wizard calls `createNomination.mutateAsync(input)` but never reads the cycle's `fairness_config.auditSettings.allowAppeals`. The `useNominations.createNomination` mutation accepts `allowAppeals` as an optional field, but it's never provided.
**Effect**: Every nomination gets `manager_approval_status = 'not_required'`, completely bypassing manager approval even when the cycle requires it.
**Evidence**: The "Code Crafter" cycle has `allowAppeals: true`, but the nomination has `manager_approval_status: not_required`.

### BUG 2 — CRITICAL: Endorsement picker easily skipped
**Location**: `NominationWizard.tsx` lines 322-336
**Problem**: After submission, the `EndorsementRequestPicker` appears inside the review card below the success checkmark. There's no step indicator, no forced interaction. The outer navigation buttons disappear (line 353: `step === 'review' && !createdNominationId` hides submit). The only way to interact is via the picker's own "Send" or "Skip" buttons — but users can simply navigate away via browser back or sidebar.
**Effect**: Zero endorsement requests created in the database.

### BUG 3 — Manager approval query doesn't filter by tenant
**Location**: `useNominationApprovals.ts` line 52-58
**Problem**: The query fetches nominations by `nominee_id` but has no `.eq('tenant_id', ...)` filter (defense-in-depth violation per project standards).

### BUG 4 — Endorsement requests query missing tenant filter
**Location**: `useEndorsements.ts` line 58-63
**Problem**: `endorsement_requests` query filters by `requested_user_id` and `status` but not `tenant_id`.

### BUG 5 — Voting booth shows nominations before endorsement threshold
**Location**: `useVoting.ts` line 89
**Problem**: Ballot query filters by `.in('status', ['endorsed', 'shortlisted'])`. Since manager approval (BUG 1) is bypassed, nominations stay at `submitted` and never reach `endorsed`. However, if they did reach `endorsed` via manager approval alone (line 73 of `useNominationApprovals.ts`), they'd appear in voting without meeting the 2-endorsement threshold.
**Note**: This is by design for manager-approved nominations, but the endorsement_status remains `pending` even after manager sets status to `endorsed`.

### BUG 6 — Notification text is hardcoded English in approval hook
**Location**: `useNominationApprovals.ts` lines 119-126
**Problem**: When manager approves and triggers endorsement notifications, the title/body are hardcoded English strings (`"requested your endorsement"`, `"Please review and endorse..."`), not using `t()` because this runs inside a mutation function where `t` may not produce the recipient's language.

### BUG 7 — Criteria weight mismatch between nomination and judging
**Location**: `nomination_criteria_evaluations` data vs `judging_criteria` data
**Observation**: Judging criteria store weights as decimals (0.25, 0.75) while nomination criteria evaluations store them as percentages (25, 75). This inconsistency will cause calculation errors in the fairness summary panel if not normalized.

---

## Complete Workflow Flow (Expected vs Actual)

```text
EXPECTED FLOW (when allowAppeals = true):
  1. Nominator selects nominee + writes justification    ✅ Works
  2. Nominator evaluates criteria weights                ✅ Works
  3. Nominator reviews & submits                         ✅ Works
  4. Nomination created with manager_approval_status=pending  ❌ BUG 1
  5. Nominator picks endorsers (saved but notifs deferred)    ❌ BUG 2
  6. Manager sees nomination in Approvals tab             ❌ Never triggers
  7. Manager approves → status='endorsed', notifs sent    ❌ Never triggers
  8. Endorsers see request in Endorse tab                 ❌ Never triggers
  9. 2+ endorsements → endorsement_status='sufficient'    ❌ Never triggers
  10. Nomination appears in Voting Booth                  ❌ Never triggers

ACTUAL FLOW:
  1-3. ✅ Nomination created successfully
  4. manager_approval_status = 'not_required' (BUG 1)
  5. User navigates away, no endorsement requests (BUG 2)
  6-10. Pipeline stalled: status stays 'submitted', never reaches 'endorsed'
```

---

## Fix Plan

### Fix 1: Pass `allowAppeals` to mutation (CRITICAL)
**File**: `NominationWizard.tsx`
- Add a query to fetch the selected cycle's `fairness_config`
- Extract `allowAppeals` from `fairness_config.auditSettings.allowAppeals`
- Pass it to `createNomination.mutateAsync({ ...input, allowAppeals })`

### Fix 2: Make endorsement picking a dedicated wizard step
**File**: `NominationWizard.tsx`
- Add `'request_endorsements'` as a 5th step after `'review'`
- After successful submission on review, auto-advance to endorsement step
- Endorsement step shows `EndorsementRequestPicker` full-width
- Remove embedded picker from review card
- "Done" button calls `onComplete`

### Fix 3: Add tenant_id defense-in-depth filters
**Files**: `useNominationApprovals.ts`, `useEndorsements.ts`
- Add `.eq('tenant_id', tenantId)` to nomination queries in both hooks

### Fix 4: Add error logging to EndorsementRequestPicker
**File**: `EndorsementRequestPicker.tsx`
- Add `console.error` in catch block for debugging

### Fix 5: Localization strings
**Files**: `en.json`, `ar.json`
- Add `endorsementStepTitle`, `endorsementStepDescription` keys

| File | Change |
|------|--------|
| `src/components/recognition/NominationWizard.tsx` | Fetch cycle config, pass `allowAppeals`, add step 5 |
| `src/hooks/recognition/useNominationApprovals.ts` | Add `tenant_id` filter |
| `src/hooks/recognition/useEndorsements.ts` | Add `tenant_id` filter |
| `src/components/recognition/EndorsementRequestPicker.tsx` | Add error logging |
| `src/locales/en.json` | Add step title/description keys |
| `src/locales/ar.json` | Add step title/description keys |

