

## Add Gregorian Date Next to Hijri Date in Prayer Widget

### What changes
In `src/components/dashboard/DashboardPrayerWidget.tsx`, the header currently shows only the Hijri date (e.g., "16 Shawwal 1447"). We will add the Gregorian date beside it.

### Implementation

**File: `src/components/dashboard/DashboardPrayerWidget.tsx`** (lines 201-206)

Update the date display to include the Gregorian readable date from the API response (`prayerData?.date?.readable`), shown on the same line or as a second line beneath the Hijri date:

```tsx
{hijri && (
  <p className="text-xs text-muted-foreground">
    {i18n.language === 'ar'
      ? `${hijri.day} ${hijri.month.ar} ${hijri.year}`
      : `${hijri.day} ${hijri.month.en} ${hijri.year}`}
    {prayerData?.date?.readable && (
      <span className="text-muted-foreground/70"> · {prayerData.date.readable}</span>
    )}
  </p>
)}
```

This uses the `readable` field already returned by the Aladhan API (e.g., "14 Apr 2026"), separated by a dot. No new API calls or data changes needed.

