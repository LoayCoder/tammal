

# Add Rawatib (Rak'ahs) to Prayer History

## What to Build

Enhance the Prayer History section to show Sunnah Rawatib completion (before/after Rak'ahs) alongside obligatory prayer data. Rawatib are already tracked in `spiritual_sunnah_logs` with keys like `rawatib_fajr_before`, `rawatib_dhuhr_after`, etc.

## RAWATIB Config (from existing code)

| Prayer | Before | After |
|--------|--------|-------|
| Fajr | 2 | — |
| Dhuhr | 2 | 2 |
| Asr | — | — |
| Maghrib | — | 2 |
| Isha | — | 2 |

## Changes

### Task 1: Create `useSunnahHistoryLogs` helper

Add a date-range-aware query for `spiritual_sunnah_logs` filtered to `rawatib_*` practice types. The existing `useSunnahLogs` only fetches 30 days and doesn't accept custom ranges — we need a new lightweight query hook that accepts `{ from, to }` like `usePrayerLogs`.

### Task 2: Enhance `usePrayerHistory` hook

- Import and call the new sunnah logs query with the same `from`/`to` range
- Add `rawatibStats` to the return value: per-prayer Rawatib completion stats (`{ prayerName, beforeCompleted, afterCompleted, beforeTotal, afterTotal, beforePct, afterPct }`)
- Add daily Rawatib count to `dailyData` for chart overlay

### Task 3: Update `PrayerHistory` component

- Add a new **Rawatib Breakdown** section below the per-prayer cards
- Show each prayer with its before/after Rak'ah completion rate (only for prayers that have Rawatib)
- Use small progress indicators with Rak'ah counts (e.g., "2 Rak'ahs before: 85%")
- Include Rawatib in the daily chart as a stacked or secondary bar
- RTL-safe with logical properties

### Task 4: i18n keys

Add to `en.json` and `ar.json`:
- `spiritual.prayer.history.rawatib` — "Sunnah Rak'ahs (Rawatib)"
- `spiritual.prayer.history.rakaahsBefore` — "Rak'ahs Before"
- `spiritual.prayer.history.rakaahsAfter` — "Rak'ahs After"
- `spiritual.prayer.history.rawatibRate` — "Rawatib Rate"

