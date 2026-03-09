

## Bug: Users Can Nominate After Nomination Period Ends

### Root Cause
The system only checks `cycle.status === 'nominating'` to determine if nominations are open. It never validates the actual `nomination_end` date. So even though nominations closed on Mar 8, 2026, the cycle status is still "nominating" and users can still submit.

### Fix (2 locations)

**1. `src/pages/recognition/NominatePage.tsx`** — Filter out cycles past their nomination deadline
- Change the `activeCycles` filter from just checking status to also checking `nomination_end > now()`
- Show a message when a cycle is in "nominating" status but the deadline has passed

**2. `src/hooks/recognition/useNominations.ts`** — Server-side guard in `createNomination`
- Before inserting, fetch the cycle's `nomination_end` date
- If `nomination_end < now()`, throw an error and block the submission
- This prevents submissions even if someone bypasses the UI

### Implementation Detail

```typescript
// NominatePage.tsx — line 23
const now = new Date().toISOString();
const activeCycles = cycles.filter(
  c => c.status === 'nominating' && c.nomination_end > now
);

// useNominations.ts — in createNomination mutationFn, before insert
const { data: cycle } = await supabase
  .from('award_cycles')
  .select('nomination_end')
  .eq('id', rest.cycle_id)
  .single();

if (cycle && new Date(cycle.nomination_end) < new Date()) {
  throw new Error(t('recognition.nominations.periodClosed'));
}
```

### Translation keys to add
- `recognition.nominations.periodClosed` — "The nomination period for this cycle has ended"

