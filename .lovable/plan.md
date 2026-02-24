

# Fix Check-in Monitor: Full Functionality Audit

## Issues Found

### 1. Console Errors -- Badge Ref Warning
`CheckinRiskPanel` and `CheckinEmployeeTable` both use the `Badge` component inside contexts that pass refs (Tooltip, Table). The `Badge` component is a plain function component without `React.forwardRef`, causing React warnings. This is a UI framework-level issue.

**Fix**: Update `Badge` in `src/components/ui/badge.tsx` to use `React.forwardRef`.

### 2. Unnecessary `as any` Type Casts (Type Safety Gap)
The hook queries `mood_entries` and `mood_definitions` using `as any` casts, even though both tables exist in the generated Supabase types. This hides type errors and removes autocomplete.

**Fix**: Remove all `as any` casts from `useCheckinMonitor.ts` and use proper typed table names.

### 3. Hardcoded English Strings in Risk Alerts
Risk alert detail messages like `"No check-ins in selected period"`, `"consecutive low mood entries"`, and `"days since last check-in"` are hardcoded in English inside the hook, breaking Arabic localization.

**Fix**: Move these to the localization files and use interpolation. Add keys to both `en.json` and `ar.json`:
- `checkinMonitor.risk.noCheckins` 
- `checkinMonitor.risk.consecutiveLow` (with `{{count}}`)
- `checkinMonitor.risk.daysSince` (with `{{days}}`)
- `checkinMonitor.risk.participationPercent` (with `{{rate}}`)

Since the hook doesn't have access to `t()`, the risk alert detail will use translation keys that get resolved in the `CheckinRiskPanel` component instead.

### 4. Mood Labels Not Bilingual
`MoodBreakdownItem.label` always uses `label_en` from `mood_definitions`. Arabic users see English mood labels.

**Fix**: In the hook, include both `label_en` and `label_ar` in the breakdown item. In `MoodDistributionBar`, display the correct label based on `i18n.language`.

### 5. Yesterday's Comparison Ignores Org Filters
The `yesterdayEntries` query fetches all tenant entries without filtering by the selected branch/division/department, making the mood trend arrow misleading when filters are active.

**Fix**: Filter `yesterdayEntries` through the same `filteredEmpIds` set used for today's data.

### 6. Query Row Limit Risk (1000 rows)
For tenants with many employees over 30 days, the `mood_entries` query could hit the Supabase default 1000-row limit, silently truncating data and showing incorrect stats.

**Fix**: Use pagination or increase the query limit with `.limit(10000)` since mood entries for a single tenant over 30 days should not exceed this. Add a safety check.

### 7. MoodDistributionBar Color Mapping Brittle
The `colorToBg` map in `MoodDistributionBar` hardcodes a fixed set of Tailwind class translations. If `mood_definitions.color` contains a value not in the map (e.g., a custom tenant color or HSL value), it falls back to `bg-muted` silently.

**Fix**: Use inline `style={{ backgroundColor }}` with the actual color value from mood_definitions, or keep the Tailwind map but make it more robust with a fallback that uses the color directly as a CSS value.

---

## Technical Changes

### File: `src/components/ui/badge.tsx`
- Wrap `Badge` with `React.forwardRef` to fix the ref warning in both `CheckinRiskPanel` and `CheckinEmployeeTable`

### File: `src/hooks/analytics/useCheckinMonitor.ts`
- Remove all `as any` casts -- use `'mood_entries'` and `'mood_definitions'` directly (they exist in types)
- Remove `as any` from data processing (use proper typing from Supabase Row types)
- Add `.limit(5000)` to the mood_entries query to prevent silent truncation
- Filter yesterday entries through `filteredEmpIds` for accurate comparison when org filters are active
- Add `labelAr` field to `MoodBreakdownItem` interface
- Change risk alert `detail` to use i18n-compatible key+params pattern instead of hardcoded English strings
- Add `detailKey` and `detailParams` to `RiskAlert` interface for i18n resolution in the component

### File: `src/components/checkin-monitor/MoodDistributionBar.tsx`
- Use bilingual label display (check `i18n.language` for Arabic vs English)
- Make color mapping more robust with inline style fallback

### File: `src/components/checkin-monitor/CheckinRiskPanel.tsx`
- Resolve risk alert detail strings using `t()` with interpolation instead of displaying raw English text

### File: `src/components/checkin-monitor/CheckinEmployeeTable.tsx`
- No structural changes needed (Badge ref fix handles the console error)

### File: `src/locales/en.json`
Add under `checkinMonitor.risk`:
```json
"noCheckinsDetail": "No check-ins in selected period",
"consecutiveLowDetail": "{{count}} consecutive low mood entries",
"daysSinceDetail": "{{days}} days since last check-in",
"participationDetail": "{{rate}}% participation"
```

### File: `src/locales/ar.json`
Add equivalent Arabic translations under `checkinMonitor.risk`.

---

## Summary of Changes

| File | Change |
|---|---|
| `badge.tsx` | Add `forwardRef` to fix console warnings |
| `useCheckinMonitor.ts` | Remove `as any`, add query limit, fix yesterday filter, add bilingual labels, i18n-ready risk details |
| `MoodDistributionBar.tsx` | Bilingual mood labels, robust color mapping |
| `CheckinRiskPanel.tsx` | Use `t()` for risk detail strings |
| `en.json` | Add 4 risk detail i18n keys |
| `ar.json` | Add 4 risk detail i18n keys (Arabic) |

### No Database Changes Required
All fixes are frontend-only code improvements.

