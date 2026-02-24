

# Prayer Status Color System Enhancement

## Summary
Redesign all prayer cards so that when a status is selected (Mosque, Home, Work, Missed), the action buttons are replaced by a color-coded status badge with smooth animation. Each status gets a distinct color for clear emotional feedback.

## Changes

### 1. Create `PrayerStatusBadge` Component
**New file:** `src/components/spiritual/PrayerStatusBadge.tsx`

A reusable badge component that renders a rounded pill with:
- Check icon + status label
- Color based on status:
  - `completed_mosque` -- Green (`bg-emerald-500/15 text-emerald-700 dark:text-emerald-400`)
  - `completed_home` -- Yellow/Amber (`bg-amber-500/15 text-amber-800 dark:text-amber-400`)
  - `completed_work` -- Gray (`bg-gray-500/15 text-gray-700 dark:text-gray-300`)
  - `missed` -- Red (`bg-red-500/15 text-red-700 dark:text-red-400`)
- Appropriate icon per status (Building2, Home, Briefcase, X)
- Consistent rounded-full styling matching the screenshot reference

### 2. Update `PrayerCard` Component
**File:** `src/components/spiritual/PrayerCard.tsx`

- Replace the current generic `<Badge>` with the new `<PrayerStatusBadge>`
- Apply color-coded card border tint based on status (e.g., `border-emerald-500/30` for mosque)
- Add CSS transition (`transition-all duration-300`) for smooth state changes
- Remove the "log now" section for missed prayers -- show all 4 buttons to allow re-logging
- Keep glass-card styling consistent with the rest of the app

### 3. No Database Changes
The existing `spiritual_prayer_logs.status` column already stores the correct values (`completed_mosque`, `completed_home`, `completed_work`, `missed`). The upsert logic in `usePrayerLogs.ts` already handles updates. No schema changes needed.

## Technical Details

**PrayerStatusBadge props:**
```text
interface PrayerStatusBadgeProps {
  status: string;  // completed_mosque | completed_home | completed_work | missed
}
```

**Color mapping object:**
```text
STATUS_COLORS = {
  completed_mosque: { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30', icon: Building2 }
  completed_home:   { bg: 'bg-amber-500/15',   text: 'text-amber-800 dark:text-amber-400',   border: 'border-amber-500/30',   icon: Home }
  completed_work:   { bg: 'bg-gray-500/15',     text: 'text-gray-700 dark:text-gray-300',     border: 'border-gray-500/30',     icon: Briefcase }
  missed:           { bg: 'bg-red-500/15',       text: 'text-red-700 dark:text-red-400',       border: 'border-red-500/30',       icon: X }
}
```

**Card behavior:**
- Not logged: Show 4 action buttons (Mosque, Home, Work, Missed)
- Logged: Hide buttons, show colored badge on the right side of the header row
- Card border tints to match the status color
- Smooth `transition-all duration-300` on the card wrapper

**Files touched:** 2 (1 new, 1 modified)
