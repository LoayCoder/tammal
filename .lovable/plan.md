

# Endorsement Timing: Current State & Recommendation

## Current Behavior

Right now, endorsement requests are sent **immediately after submission** — before manager approval. Both processes run in parallel:

```text
Submit Nomination
  ├── Manager sees it in "Approvals" tab (if Allow Appeals = on)
  └── Colleagues see it in "Endorse" tab (immediately)
```

This creates a problem: a colleague could endorse a nomination that the manager later **rejects**.

## Recommended Fix

Endorsement requests should only become visible **after manager approval** (or immediately if approval is not required).

```text
Submit Nomination
  ├── [Allow Appeals ON]  → Manager approves → Endorsement requests become active
  └── [Allow Appeals OFF] → Endorsement requests become active immediately
```

### Changes

**1. `useEndorsements.ts` — Filter by approval status**
- In `myEndorsementRequests` query, add a filter: only show nominations where `manager_approval_status` is `'approved'` or `'not_required'`
- Change the status filter from `.in('status', ['submitted', 'endorsed'])` to also check `manager_approval_status`

**2. `EndorsementRequestPicker.tsx` — Delay notifications**
- When `manager_approval_status === 'pending'`, still save the `endorsement_requests` rows but skip sending notifications
- Add a note in the UI: "Endorsement requests will be sent after manager approval"

**3. `useNominationApprovals.ts` — Trigger notifications on approval**
- In the `approve` mutation, after updating status, check for pending `endorsement_requests` and create `recognition_notifications` for each requested user

**4. Localization**
- Add key: `endorsementsPendingApproval` — "Endorsement requests will be sent after manager approval"

### Files

| File | Change |
|------|--------|
| `src/hooks/recognition/useEndorsements.ts` | Add `manager_approval_status` filter |
| `src/components/recognition/EndorsementRequestPicker.tsx` | Conditionally skip notifications, show pending message |
| `src/hooks/recognition/useNominationApprovals.ts` | Send endorsement notifications on approval |
| `src/locales/en.json` | Add pending approval message |
| `src/locales/ar.json` | Add pending approval message |

