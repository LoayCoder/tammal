

# Qur'an History & Trends

## What to Build

Add a collapsible "History & Trends" section to `/spiritual/quran` (QuranReader page), mirroring the Prayer History pattern. Users select a timeframe and see:

1. **Duration trend chart** — BarChart showing daily reading minutes
2. **Summary stats** — Total sessions, total minutes, average per session, reading days count over the selected period
3. **Streak indicator** — Current and best consecutive reading day streaks
4. **Juz/Surah breakdown** — Most-read surahs or juz distribution (if data exists)

## Implementation

### Task 1: Create `useQuranHistory` hook

`src/hooks/spiritual/useQuranHistory.ts` — mirrors `usePrayerHistory` pattern:
- State for `range` (week/month/quarter/year/custom) + custom dates
- Computes `from`/`to` date boundaries
- Calls `useQuranSessions({ from, to })` (already supports date ranges)
- Derives:
  - `dailyData[]` — `{ date, totalMinutes, sessionCount }` for each day in range
  - `topSurahs[]` — aggregated surah frequency/duration
  - `currentStreak` / `bestStreak` — consecutive days with at least 1 session
  - Period totals: `totalMinutes`, `totalSessions`, `avgMinutesPerSession`, `activeDays`

### Task 2: Create `QuranHistory` component

`src/components/spiritual/QuranHistory.tsx` — collapsible card matching PrayerHistory styling:
- ToggleGroup for range selection
- Custom date pickers when range is "custom"
- Recharts BarChart showing daily minutes (primary bar) and session count (secondary bar)
- Summary stat cards: total minutes, sessions, active days, avg per session
- Streak display with flame icons
- Top surahs mini-list (top 5 by session count)
- RTL-safe with logical properties

### Task 3: Integrate into QuranReader page

Add `<QuranHistory />` below the weekly stats section in `QuranReader.tsx`.

### Task 4: i18n keys

Add to `en.json` and `ar.json`:
- `spiritual.quran.history.title` — "Reading History"
- `spiritual.quran.history.week/month/quarter/year/custom` — range labels
- `spiritual.quran.history.totalMinutes` — "Total Minutes"
- `spiritual.quran.history.totalSessions` — "Total Sessions"
- `spiritual.quran.history.activeDays` — "Active Days"
- `spiritual.quran.history.avgPerSession` — "Avg per Session"
- `spiritual.quran.history.streak` — "Current Streak"
- `spiritual.quran.history.bestStreak` — "Best Streak"
- `spiritual.quran.history.days` — "days"
- `spiritual.quran.history.minutes` — "min"
- `spiritual.quran.history.topSurahs` — "Most Read Surahs"
- `spiritual.quran.history.noData` — "No reading data for this period"
- `spiritual.quran.history.dailyMinutes` — "Daily Minutes"
- `spiritual.quran.history.sessions` — "Sessions"

No database changes needed — `useQuranSessions` already supports `{ from, to }` date range queries.

