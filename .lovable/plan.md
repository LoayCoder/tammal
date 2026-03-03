

# Integrate Rawatib into Each Prayer Card + Position Duha

## Overview
Move Rawatib tracking from a standalone card into each obligatory prayer card, with the correct rak'ah configuration per prayer. Place Duha as its own card between Fajr and Dhuhr in the grid.

## Rawatib Configuration Per Prayer

| Prayer  | Before | After |
|---------|--------|-------|
| Fajr    | --     | 2     |
| Dhuhr   | 2      | 2     |
| Asr     | --     | --    |
| Maghrib | --     | 2     |
| Isha    | --     | 2     |

## Changes

### 1. Define Rawatib config constant
**File:** `src/components/spiritual/PrayerCard.tsx`

Add a config map:
```typescript
const RAWATIB_CONFIG: Record<string, { before?: number; after?: number }> = {
  Fajr:    { after: 2 },
  Dhuhr:   { before: 2, after: 2 },
  Asr:     {},
  Maghrib: { after: 2 },
  Isha:    { after: 2 },
};
```

### 2. Extend PrayerCard to include Rawatib toggles
**File:** `src/components/spiritual/PrayerCard.tsx`

Add new props:
- `sunnahBefore?: boolean` -- is the "before" sunnah completed today
- `sunnahAfter?: boolean` -- is the "after" sunnah completed today  
- `onToggleSunnah?: (type: 'before' | 'after', completed: boolean) => void`
- `sunnahPending?: boolean`

Inside the card, below the obligatory prayer status/buttons, render a small Rawatib section (only if the prayer has rawatib config):
- Show "2 Rak'ahs before" toggle (if `before` exists) -- small pill/chip button
- Show "2 Rak'ahs after" toggle (if `after` exists) -- small pill/chip button
- Each toggle is a compact button with a check icon when done
- Uses `📿` emoji prefix for visual consistency

For Asr, nothing extra is rendered (empty config).

### 3. Update Sunnah log keys for per-prayer Rawatib
Instead of one generic `rawatib` key, use per-prayer keys in `spiritual_sunnah_logs`:
- `rawatib_fajr_after`
- `rawatib_dhuhr_before`, `rawatib_dhuhr_after`
- `rawatib_maghrib_after`
- `rawatib_isha_after`

This allows tracking each individual Rawatib independently.

**File:** `src/hooks/spiritual/useSunnahLogs.ts`
- Remove the generic `rawatib` entry from `SUNNAH_PRACTICES` (keep `duha`)
- The `togglePractice` mutation already accepts any `practice_type` string, so no mutation change needed
- Update `todayCompleted` set -- it already works with any practice_type

### 4. Reorder grid and place Duha between Fajr and Dhuhr
**File:** `src/pages/spiritual/PrayerTracker.tsx`

Instead of mapping `PRAYER_NAMES` then appending voluntary cards, build an explicit ordered list:

1. **Fajr** (PrayerCard with rawatib after)
2. **Duha** (standalone sunnah card -- keep current style with emoji toggle)
3. **Dhuhr** (PrayerCard with rawatib before + after)
4. **Asr** (PrayerCard, no rawatib)
5. **Maghrib** (PrayerCard with rawatib after)
6. **Isha** (PrayerCard with rawatib after)

Remove the `voluntaryPractices.map` block. Duha card rendered inline in the correct position.

Pass sunnah state to each PrayerCard:
```typescript
<PrayerCard
  prayerName="Fajr"
  prayerTime={...}
  log={todayLogs.Fajr}
  onLog={...}
  sunnahAfter={todayCompleted.has('rawatib_fajr_after')}
  onToggleSunnah={(type, done) => 
    togglePractice.mutate({ practice_type: `rawatib_fajr_${type}`, completed: done })
  }
/>
```

### 5. Localization
**Files:** `src/locales/en.json`, `src/locales/ar.json`

Add keys:
- `spiritual.prayer.rakahsBefore`: "{{count}} Rak'ahs before" / "{{count}} ركعات قبل"
- `spiritual.prayer.rakahsAfter`: "{{count}} Rak'ahs after" / "{{count}} ركعات بعد"
- `spiritual.prayer.sunnah`: "Sunnah" / "سنة"

### 6. Update SunnahTracker stats
**File:** `src/pages/spiritual/SunnahTracker.tsx`

The Sunnah Tracker page iterates `SUNNAH_PRACTICES` for stats. Since we removed the generic `rawatib` entry, the per-prayer rawatib logs won't show there (they're tracked in Prayer Tracker context). The remaining practices (fasting, adhkar_morning, adhkar_evening, tahajjud, duha) display normally. Adjust grid back to appropriate column count.

## Files to modify
- `src/components/spiritual/PrayerCard.tsx` -- add rawatib config + toggle UI
- `src/pages/spiritual/PrayerTracker.tsx` -- reorder grid, pass sunnah props, place Duha inline
- `src/hooks/spiritual/useSunnahLogs.ts` -- remove generic `rawatib` from SUNNAH_PRACTICES
- `src/locales/en.json` -- add rak'ah labels
- `src/locales/ar.json` -- add rak'ah labels
- `src/pages/spiritual/SunnahTracker.tsx` -- adjust grid for 5 items

## No database changes needed
The `spiritual_sunnah_logs.practice_type` is a free-text field; new keys like `rawatib_fajr_after` work without migration.
