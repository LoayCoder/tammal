

## Match Prayer Action Button Icons to Top Icon Style

**Problem**: The Mosque / Home / Work action buttons (lines 166-174) use `Building2`, `Home`, and `Briefcase` icons which are visually heavier than the thin, minimal icons used elsewhere in the widget (like `Clock`, `Timer`, `Check`, `ChevronRight`). They need to match the same thin, clean, outline aesthetic.

### Changes (single file: `src/components/dashboard/DashboardPrayerWidget.tsx`)

**1. Replace heavier icons with thinner, cleaner alternatives**

| Current Icon | Replacement | Reason |
|---|---|---|
| `Building2` (Mosque) | `Landmark` | Cleaner outline, fewer internal lines, matches minimal style |
| `Home` | `House` | Thinner outline variant, consistent stroke weight |
| `Briefcase` | `Building` | Simpler outline, less visual weight |

**2. Reduce `ICON_STROKE` from `1.75` to `1.5`**
This makes all icons across the widget thinner and more consistent with the clean, minimal aesthetic described.

**3. Apply same changes in `PrayerCard.tsx`**
Update the same three icons and add `strokeWidth={1.5}` to match (currently uses default strokeWidth of 2, which is heavier).

### Files Modified
- `src/components/dashboard/DashboardPrayerWidget.tsx` — swap icons, adjust stroke
- `src/components/spiritual/PrayerCard.tsx` — swap icons, add consistent strokeWidth

