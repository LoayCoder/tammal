
# Full Integration Audit: Streaks & Points System

## Audit Summary

After thorough inspection of all hooks, components, pages, edge functions, database schema, and RLS policies, I identified **7 issues** (3 critical, 2 high, 2 medium).

---

## Detected Issues

### CRITICAL-1: RLS Blocks Regular Users from Earning Points (Voting & Redemption)
- **Where**: `points_transactions` INSERT policy
- **Root Cause**: The INSERT policy requires `has_role('tenant_admin')` or `has_role('super_admin')`. Regular employees cannot insert rows.
- **Impact**: 
  - Voting participation points (`useVoting.ts` line 255) silently fail for regular users
  - Redemption debit entries (`useRedemption.ts` line 95) fail, breaking reward redemption entirely
- **Risk**: HIGH — Core feature is non-functional for all non-admin users
- **Fix**: Add a new INSERT policy allowing authenticated users to insert their own points: `user_id = auth.uid() AND tenant_id = get_user_tenant_id(auth.uid())`

### CRITICAL-2: Two Separate Points Systems Are Not Connected
- **Where**: `mood_entries.points_earned` (wellness streaks) vs `points_transactions` (recognition points)
- **Root Cause**: Daily check-in points are stored in `mood_entries.points_earned` and summed by `useGamification.ts`. They never create entries in `points_transactions`. The `/recognition/points` dashboard only reads from `points_transactions`.
- **Impact**: Check-in streak points are invisible on the Points Dashboard and cannot be redeemed for rewards
- **Risk**: HIGH — Users see different point totals on different pages
- **Fix**: After each check-in, also insert a `points_transactions` row with `source_type: 'daily_checkin'`. Update the validation trigger to accept `'daily_checkin'` as a valid source type.

### CRITICAL-3: No Server-Side Balance Validation on Redemption
- **Where**: `useRedemption.ts` redeem mutation (line 84-106)
- **Root Cause**: Balance check is only done on the frontend (`canAfford` in RedemptionCard). The backend has no constraint preventing negative balances. A user can race two redemption requests simultaneously.
- **Impact**: Users can redeem more points than they have via concurrent requests
- **Risk**: HIGH — Financial/reward abuse vector
- **Fix**: Add a database function or edge function that atomically checks balance before inserting the redemption + debit transaction.

### HIGH-1: Streak Calculation Has Timezone Bug
- **Where**: `useGamification.ts` line 23-36
- **Root Cause**: `new Date()` uses the browser's local timezone, but `entry_date` is a date string from Postgres (UTC-based). A user who checks in at 11 PM local time may see the streak break the next morning because the date comparison shifts.
- **Impact**: Streaks may incorrectly reset or inflate depending on the user's timezone offset
- **Fix**: Normalize both dates to UTC for comparison, or use a consistent timezone strategy.

### HIGH-2: Voting Points Awarded Even on Insert Failure
- **Where**: `useVoting.ts` line 252-262
- **Root Cause**: Points insertion is in `onSuccess` callback but uses `.then()` which doesn't throw on RLS failure. The insert silently fails (due to CRITICAL-1) but the success toast still shows.
- **Impact**: Users see "vote submitted" success but points never appear
- **Fix**: Move points award into the main `mutationFn` (within the same try/catch), and handle errors properly.

### MEDIUM-1: `validate_points_transaction` Trigger Missing 'daily_checkin' Source Type
- **Where**: Database trigger `validate_points_transaction`
- **Root Cause**: The allowed `source_type` values don't include `'daily_checkin'`, `'survey_completion'`, or other wellness activities. If we connect the two systems (CRITICAL-2 fix), inserts will be rejected.
- **Impact**: Blocks the integration fix
- **Fix**: Add new source types to the validation trigger.

### MEDIUM-2: No `max_per_year` Enforcement on Redemptions
- **Where**: `RedemptionCard.tsx` and `useRedemption.ts`
- **Root Cause**: The `max_per_year` field on `redemption_options` is displayed in the UI but never enforced. Users can redeem the same reward unlimited times.
- **Impact**: Admin-configured limits are cosmetic only
- **Fix**: Before inserting a redemption request, count existing non-rejected requests for the same option in the current year.

---

## Fix Plan (Ordered by Priority)

### Step 1: Fix RLS on `points_transactions` (CRITICAL-1)
Add an INSERT policy allowing regular users to insert rows where `user_id = auth.uid()`.

### Step 2: Connect Check-in Points to the Points Ledger (CRITICAL-2)
- Update `validate_points_transaction` trigger to accept `'daily_checkin'` and `'survey_completion'`
- In `InlineDailyCheckin.tsx` and `DailyCheckin.tsx`, after inserting the mood entry, also insert a `points_transactions` row with the same amount
- Invalidate `points-transactions` query key after check-in

### Step 3: Move Voting Points into mutationFn (HIGH-2)
Move the points insert from `onSuccess` into the main `mutationFn` body with proper error handling.

### Step 4: Add Server-Side Balance Check for Redemptions (CRITICAL-3)
Create a database function `redeem_points(p_user_id, p_tenant_id, p_option_id, p_points_cost)` that:
1. Calculates current balance from `points_transactions`
2. Checks `max_per_year` usage count
3. Only inserts the redemption request + debit if balance is sufficient
4. Returns error if insufficient

Replace the current two-step client insert with a single RPC call.

### Step 5: Fix Timezone in Streak Calculation (HIGH-1)
Normalize date comparisons in `useGamification.ts` to use UTC consistently.

### Step 6: Enforce max_per_year (MEDIUM-2)
Add a count check in the redemption function for requests in the current calendar year.

---

## Confirmation Report

| Area | Status | Notes |
|------|--------|-------|
| Points schema & RLS | Needs fix | INSERT blocked for regular users |
| Points balance logic | Correct | Properly sums credited + redeemed |
| Expiry mechanism | Correct | Weekly cron marks expired, excluded from balance |
| Transaction history UI | Correct | Shows all statuses with proper formatting |
| Redemption catalog UI | Correct | Category filtering, RTL support working |
| Redemption flow | Needs fix | No server-side balance check, no max_per_year enforcement |
| Check-in streak logic | Needs fix | Timezone inconsistency |
| Check-in points | Needs fix | Not connected to recognition points ledger |
| Voting participation points | Needs fix | RLS blocks insert + error handling gap |
| Points expiry edge function | Correct | Properly marks expired, idempotent |
| Results calculation | Correct | Awards points correctly (but blocked by RLS) |
| Leaderboards | Missing | No leaderboard component exists yet |

---

## Technical Details

### New Database Migration (Steps 1, 2, 4, 6)

```sql
-- Step 1: Allow regular users to insert their own points
CREATE POLICY "Users can insert own points"
ON points_transactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- Step 2: Update validation trigger to accept new source types
CREATE OR REPLACE FUNCTION validate_points_transaction() ...
  -- Add 'daily_checkin', 'survey_completion' to allowed source_types

-- Step 4 & 6: Atomic redemption function
CREATE OR REPLACE FUNCTION redeem_points(
  p_user_id uuid, p_tenant_id uuid,
  p_option_id uuid, p_points_cost int
) RETURNS uuid ...
  -- Calculates balance, checks max_per_year, inserts atomically
```

### Files to Modify
1. `src/hooks/wellness/useGamification.ts` — UTC normalization
2. `src/components/checkin/InlineDailyCheckin.tsx` — Add points_transactions insert
3. `src/pages/employee/DailyCheckin.tsx` — Add points_transactions insert
4. `src/hooks/recognition/useVoting.ts` — Move points into mutationFn
5. `src/hooks/recognition/useRedemption.ts` — Replace two-step insert with RPC call
