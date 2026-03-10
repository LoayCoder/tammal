

## Missing Feature: Automatic Points Rewards for Winners

### Current State
When the `calculate-recognition-results` edge function runs, it:
- Calculates scores and ranks nominees
- Sends `award_won` notifications to top 3
- Updates nomination statuses to `shortlisted`

But it **never awards any points**. The database already supports the source types (`award_win`, `award_runner_up`, `award_finalist`) in the `points_transactions` validation trigger — they're just never inserted.

There's also no configuration table or cycle-level setting for how many points each rank should receive.

### Proposed Fix

**1. Add points configuration to `award_cycles` table**

Add a `points_config` JSONB column to `award_cycles` so admins can configure per-cycle reward amounts:

```sql
ALTER TABLE award_cycles
ADD COLUMN points_config jsonb DEFAULT '{"first_place": 500, "second_place": 300, "third_place": 150, "nominator_bonus": 50}'::jsonb;
```

**2. Award points in the edge function**

After calculating results and inserting rankings, insert `points_transactions` for the top 3 nominees per theme:

- Rank 1 → `source_type: 'award_win'`, amount from `points_config.first_place` (default 500)
- Rank 2 → `source_type: 'award_runner_up'`, amount from `points_config.second_place` (default 300)
- Rank 3 → `source_type: 'award_finalist'`, amount from `points_config.third_place` (default 150)
- Optionally: award `nominator_bonus` points to the nominators of top 3

**3. Add points config UI in the cycle edit dialog**

Add a "Rewards" section in the cycle configuration dialog where admins can set point values for 1st, 2nd, 3rd place and nominator bonus.

**4. Update the Rewards page**

Show award-related point earnings distinctly (with award icons) so winners can see their prize points.

### Files to Change
- **Database**: Add `points_config` column to `award_cycles`
- **`supabase/functions/calculate-recognition-results/index.ts`**: Insert points after ranking
- **Cycle edit dialog component**: Add rewards/points config fields
- **`src/hooks/recognition/usePoints.ts`**: No change needed (already shows all transactions)

