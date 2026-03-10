

## Shortlisted Display on Dashboard with Acknowledgment

### What the user wants
1. When a nominee is **shortlisted** (placed in top rankings), show a prominent card on their **Employee Dashboard** (EmployeeHome)
2. The nominee must **click an acknowledgment button** to confirm they've seen their placement
3. Support up to **top 15 placements** (not just top 3)
4. All related settings (shortlist count, acknowledgment requirement, rewards tiers) should be **configurable during award cycle creation**

### Current State
- The edge function hardcodes top 3 for shortlisting, notifications, and points
- No acknowledgment tracking exists (no `acknowledged_at` column)
- No dashboard widget for shortlisted nominees
- Cycle builder has no setting for shortlist count or acknowledgment toggle
- `points_config` only has `first_place`, `second_place`, `third_place`

### Database Changes

**1. Add columns to `award_cycles`**
```sql
ALTER TABLE award_cycles
ADD COLUMN shortlist_count integer DEFAULT 3,
ADD COLUMN require_acknowledgment boolean DEFAULT true;
```

**2. Add acknowledgment column to `nominee_rankings`**
```sql
ALTER TABLE nominee_rankings
ADD COLUMN acknowledged_at timestamptz DEFAULT NULL;
```

### Edge Function Update (`calculate-recognition-results/index.ts`)
- Replace hardcoded `3` with `cycle.shortlist_count` (default 3, max 15)
- Shortlist top N nominations instead of just top 3
- Send `award_won` notifications to all top N
- Distribute points: use `points_config` with keys `place_1` through `place_15`, falling back to 0 for unconfigured ranks

### Cycle Builder Changes

**Add "Results" settings to cycle creation and edit dialogs:**
- **Shortlist count** (1-15 slider) — how many nominees are shortlisted per theme
- **Require acknowledgment** toggle — whether nominees must acknowledge their placement
- **Points per rank** — dynamic list of point inputs based on shortlist count (e.g., if shortlist_count = 5, show 5 point fields)
- **Nominator bonus** — stays as-is

### New Dashboard Widget (`DashboardShortlistWidget.tsx`)
- Query `nominee_rankings` joined with `nominations` where `nominations.nominee_id = current_user_id` and `acknowledged_at IS NULL`
- Show a celebratory card per placement with:
  - Rank number, theme name, cycle name
  - Points earned
  - **"Acknowledge" button** that updates `nominee_rankings.acknowledged_at = now()`
- If `require_acknowledgment = false`, still show the card but without the mandatory acknowledge button (just informational)
- Place it on `EmployeeHome.tsx` below endorsement requests, above voting widget

### Files to Change
- **Database migration**: Add `shortlist_count`, `require_acknowledgment` to `award_cycles`; add `acknowledged_at` to `nominee_rankings`
- **`supabase/functions/calculate-recognition-results/index.ts`**: Use dynamic shortlist count
- **`src/features/cycle-builder/types.ts`**: Add shortlist_count and require_acknowledgment to defaults
- **`src/features/cycle-builder/components/CycleBasicsTab.tsx`** or new tab: Add shortlist/acknowledgment settings
- **`src/components/recognition/CycleEditDialog.tsx`**: Add shortlist/acknowledgment fields to Rewards tab
- **`src/components/dashboard/DashboardShortlistWidget.tsx`** (new): Shortlist acknowledgment card
- **`src/pages/EmployeeHome.tsx`**: Import and render the new widget
- **`src/hooks/recognition/useAwardCycles.ts`**: Update AwardCycle type
- **Translation files**: New keys for shortlist settings and acknowledgment UI

