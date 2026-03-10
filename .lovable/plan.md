

## Fix: Nomination Still Shows "Endorsed" After Award Announced

### Problem
Nomination `93cb211b` is ranked #1 in an announced cycle, but its `status` is still `"endorsed"` instead of `"shortlisted"`. The edge function fix only applies to future calculations.

### Two-Part Fix (same pattern as the endorsement fix)

**1. Fix existing stale data**

Update nominations that have results calculated (exist in `nominee_rankings`) and belong to announced/archived cycles:

```sql
UPDATE nominations
SET status = 'shortlisted'
WHERE id IN (
  SELECT nr.nomination_id FROM nominee_rankings nr
  JOIN theme_results tr ON tr.id = nr.theme_results_id
  JOIN award_cycles ac ON ac.id = tr.cycle_id
  WHERE ac.status IN ('announced', 'archived')
    AND nr.rank <= 3
    AND nr.deleted_at IS NULL
)
AND status = 'endorsed'
AND deleted_at IS NULL;
```

**2. UI safeguard in NominationCard.tsx**

Add a defensive derivation: if the cycle is announced/archived, check the nomination's award context. But simpler: the `NominationCard` already has the `displayedEndorsementStatus` pattern. We should also derive `displayedStatus` — if `endorsement_status` is `'sufficient'` and status is `'endorsed'`, and the cycle is announced, show `'shortlisted'`.

However, `NominationCard` doesn't receive cycle status. The simpler approach: just fix the data and trust the edge function going forward. No additional UI safeguard needed since the root cause is now handled in the edge function.

### Files Changed
- **Database**: One `UPDATE` statement via insert tool to fix existing data

