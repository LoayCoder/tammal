

## Fix: Nomination Status Not Updated After Results Calculation

### Problem
When the `calculate-recognition-results` edge function runs and advances the cycle to "announced", it never updates the individual nomination records. So:
- **Winning nominations** still show status = "endorsed" instead of "shortlisted"
- **Endorsement badges** still show "pending" even though the process is complete

The edge function calculates scores, inserts `theme_results` and `nominee_rankings`, then advances the cycle — but never touches the `nominations` table.

### Solution
Add nomination status updates to the edge function after results are calculated:

**File: `supabase/functions/calculate-recognition-results/index.ts`**

After inserting `nominee_rankings` (line ~351), before advancing cycle status:

1. **Update top-3 nominations** → set `status: 'shortlisted'`, `endorsement_status: 'sufficient'`
2. **Update remaining nominations** in the cycle → ensure `endorsement_status: 'sufficient'` (they were already endorsed to be eligible)

```typescript
// After nominee_rankings insertion, update nomination statuses
const top3NominationIds = nomineeScores.slice(0, 3).map(ns => ns.nomination_id);
if (top3NominationIds.length > 0) {
  await supabase
    .from('nominations')
    .update({ status: 'shortlisted', endorsement_status: 'sufficient' })
    .in('id', top3NominationIds);
}

// Ensure all eligible nominations in this theme have endorsement_status synced
const allNomIds = themeNominations.map(n => n.id);
await supabase
  .from('nominations')
  .update({ endorsement_status: 'sufficient' })
  .in('id', allNomIds)
  .eq('endorsement_status', 'pending');
```

This is a single file change in the edge function. No UI changes needed — the existing `NominationCard` already has color mappings for "shortlisted" status and "sufficient" endorsement status.

