

## Plan: Migrate PrayerStatusBadge to Shared StatusBadge

### Current State
`PrayerStatusBadge` uses a custom `<span>` with manual color classes instead of the shared `Badge`-based `StatusBadge` component. It has 4 statuses: `completed_mosque`, `completed_home`, `completed_work`, `missed`.

### Changes

**1. Add `PRAYER_STATUS_CONFIG` preset (`src/shared/status-badge/presets.ts`)**
- Add a new config mapping the 4 prayer statuses with appropriate icons (Building2, Home, Briefcase, X) and custom className colors matching the current design.

**2. Export from barrel (`src/shared/status-badge/index.ts`)**
- Add `PRAYER_STATUS_CONFIG` to exports.

**3. Refactor `PrayerStatusBadge` (`src/components/spiritual/PrayerStatusBadge.tsx`)**
- Replace the custom span implementation with `<StatusBadge>` using `PRAYER_STATUS_CONFIG`, `showIcon`, `translationPrefix="spiritual.prayer.status"`.

| File | Action |
|---|---|
| `src/shared/status-badge/presets.ts` | Add `PRAYER_STATUS_CONFIG` |
| `src/shared/status-badge/index.ts` | Export new config |
| `src/components/spiritual/PrayerStatusBadge.tsx` | Rewrite as thin wrapper |

