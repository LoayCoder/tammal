

# Prayer History & Trends

## What to Build

Add a collapsible "History & Trends" section below the existing weekly summary on `/spiritual/prayer`. Users can toggle between Week, Month, Quarter, Year, or Custom date range and see:

1. **Completion trend chart** — Recharts BarChart showing daily completion rate (% of 6 prayers completed per day), grouped by prayer name with color coding
2. **Per-prayer breakdown** — Small stat cards showing completion % for each prayer (Fajr, Dhuhr, Asr, Maghrib, Isha, Witr) over the selected period
3. **Streak indicator** — Current consecutive-days streak and best streak

## Implementation

### Task 1: Create `usePrayerHistory` Hook

New hook `src/hooks/spiritual/usePrayerHistory.ts`:
- Accepts a `range` param: `'week' | 'month' | 'quarter' | 'year' | 'custom'` plus optional custom start/end
- Computes date boundaries (7d, 30d, 90d, 365d)
- Calls `usePrayerLogs({ from, to })` with the computed range
- Derives:
  - Daily completion data array `{ date, completed, total, pct, byPrayer: Record<string, status> }`
  - Per-prayer stats `{ prayerName, completed, total, pct }`
  - Current streak and best streak

### Task 2: Create `PrayerHistory` Component

New component `src/components/spiritual/PrayerHistory.tsx`:
- Toggle group for range selection (Week / Month / Quarter / Year / Custom)
- Custom range: two date pickers (reuse Calendar/Popover pattern)
- Recharts `BarChart` showing daily completion % with responsive container
- 6 small stat cards in a grid for per-prayer breakdown
- Streak display with flame icon
- RTL-safe (logical properties, `text-start/end`)
- Uses glass-card styling consistent with existing spiritual UI

### Task 3: Integrate into PrayerTracker Page

Add `<PrayerHistory />` below the existing weekly summary card in `PrayerTracker.tsx`.

### Task 4: i18n Keys

Add to `en.json` and `ar.json`:
- `spiritual.prayer.history.title` — "Prayer History"
- `spiritual.prayer.history.week/month/quarter/year/custom` — range labels
- `spiritual.prayer.history.completionRate` — "Completion Rate"
- `spiritual.prayer.history.streak` — "Current Streak"
- `spiritual.prayer.history.bestStreak` — "Best Streak"
- `spiritual.prayer.history.days` — "days"
- `spiritual.prayer.history.perPrayer` — "Per Prayer"
- `spiritual.prayer.history.noData` — "No prayer data for this period"

No database changes needed — the existing `spiritual_prayer_logs` table with its date-range query already supports this.

