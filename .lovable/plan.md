

## Phase 9 — Engagement Intelligence Detail Page

### Assessment

There is currently **no dedicated detail page** for engagement intelligence. All pulse data lives in a compact card (`TeamPulseCard`) on the employee dashboard. The data infrastructure for a detail page already exists:

- **`pulse_targets`** table stores daily engagement scores, targets, and metrics per employee/scope — perfect for trend charts
- **`engagement_action_log`** tracks CTA clicks, nudge dismissals, appreciations — provides action history
- **`appreciations`** table has timestamped records for appreciation activity trends
- **`mood_entries`** and **`employee_responses`** provide participation data
- **`team-pulse-engine`** edge function already computes weighted composite scores

No existing route or page covers this domain.

### Plan

#### 1. Create new route `/engagement-insights`

**File**: `src/App.tsx`

Add a new route accessible to all authenticated users (below employee routes). Lazy-load the page component.

#### 2. Create the feature page

**New file**: `src/pages/EngagementInsights.tsx`

Premium executive-style page with `PageHeader` (card variant, Activity icon). Contains role-aware content using `usePulseModes` to determine scope. Five collapsible sections in a vertical stack:

1. **Pulse Trend** — Line chart showing engagement score over time (from `pulse_targets`)
2. **Participation Overview** — Two mini stat cards: check-in consistency + survey response rate (from existing analytics)
3. **Appreciation Activity** — Area chart of appreciation volume by week (from `appreciations` table, grouped by week)
4. **Engagement Actions Log** — DataTable showing recent CTA/nudge/appreciation actions (from `engagement_action_log`)
5. **Active Recommendations** — Current AI pulse insight + target + CTA (reuses existing `TeamPulseCard` sub-components inline)

#### 3. Create data hook

**New file**: `src/features/team-pulse/hooks/useEngagementTrends.ts`

Single hook that queries:
- `pulse_targets` — last 30 days of daily scores for the current scope (personal/team/org)
- `appreciations` — count grouped by week for the last 90 days
- `engagement_action_log` — last 50 actions for the current employee

Returns `{ pulseTrend, appreciationTrend, actionLog, isPending }`.

#### 4. Build chart components

**New files in `src/features/team-pulse/components/`**:

- **`PulseTrendChart.tsx`** — Recharts line chart with `chart-2` color, premium glass tooltip, responsive. Shows engagement score (0-100) over time.
- **`AppreciationTrendChart.tsx`** — Recharts area chart showing weekly appreciation volume with `chart-3` fill.
- **`EngagementActionTable.tsx`** — Uses existing `DataTable` component. Columns: Date, Action Type (badge), Source. Capped at 50 rows, no pagination needed.

#### 5. Add navigation entry

**File**: `src/features/team-pulse/components/TeamPulseCard.tsx`

Add a subtle "View Details" link (`ChevronRight` icon) in the card header that navigates to `/engagement-insights`.

#### 6. Add i18n keys

**Files**: `src/locales/en.json`, `src/locales/ar.json`

Add keys under `engagementInsights.*` for page title, section headers, empty states, and column labels.

#### 7. Export from feature barrel

**File**: `src/features/team-pulse/index.ts`

Export new hook and page-level components.

### Design Approach

- `PageHeader` card variant with Activity icon
- All charts in `ChartCard` wrappers (glass surface)
- `CollapsibleCard` pattern (same as OrgDashboard OverviewTab) for show/hide
- `PulseModeSwitcher` at top for scope selection
- Mobile: single-column stack, charts at full width, table scrolls horizontally
- All tokens from `@/theme/tokens` — no hardcoded colors
- `animate-in fade-in` entrance on sections

### Files Summary

| File | Action |
|------|--------|
| `src/pages/EngagementInsights.tsx` | **Create** — Main page |
| `src/features/team-pulse/hooks/useEngagementTrends.ts` | **Create** — Data hook |
| `src/features/team-pulse/components/PulseTrendChart.tsx` | **Create** — Line chart |
| `src/features/team-pulse/components/AppreciationTrendChart.tsx` | **Create** — Area chart |
| `src/features/team-pulse/components/EngagementActionTable.tsx` | **Create** — Action log table |
| `src/features/team-pulse/components/TeamPulseCard.tsx` | **Modify** — Add "View Details" link |
| `src/features/team-pulse/index.ts` | **Modify** — Export new components |
| `src/App.tsx` | **Modify** — Add route |
| `src/locales/en.json` | **Modify** — Add i18n keys |
| `src/locales/ar.json` | **Modify** — Add i18n keys |

### What Is Not Changing

- No database migrations — all tables exist
- No edge function changes
- No new dependencies (Recharts already installed)
- Existing `TeamPulseCard` functionality unchanged

