

## Fix: Stale Endorsement Status on Existing Nominations

### Root Cause

The previous code fix to `useNominationApprovals.ts` only applies to **future** approvals. The existing nomination (`93cb211b...`) was approved **before** that fix, so its database record still has `endorsement_status: 'pending'` while `status: 'endorsed'`. This is a data inconsistency that no amount of code changes will fix — the stale row must be updated.

### Two-Part Fix

**1. Fix existing stale data (database update)**

Update all nominations where `status` is `'endorsed'` or `'shortlisted'` but `endorsement_status` is still `'pending'`:

```sql
UPDATE nominations
SET endorsement_status = 'sufficient'
WHERE status IN ('endorsed', 'shortlisted')
  AND endorsement_status = 'pending'
  AND deleted_at IS NULL;
```

**2. Add a UI safeguard in NominationCard (defensive code)**

Derive the displayed endorsement status so that if the nomination is already endorsed/shortlisted, the badge always shows "sufficient" — even if the database is somehow inconsistent:

```typescript
// In NominationCard, before rendering:
const displayedEndorsementStatus =
  ['endorsed', 'shortlisted'].includes(nomination.status)
    ? 'sufficient'
    : nomination.endorsement_status;
```

Then use `displayedEndorsementStatus` for the badge color and label instead of `nomination.endorsement_status`.

### Files Changed
- **Database**: One `UPDATE` statement to fix existing data
- **`src/components/recognition/NominationCard.tsx`**: Add derived endorsement status (~3 lines)

