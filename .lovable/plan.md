

## Make Prayer Check Tick Green

In `src/components/dashboard/DashboardPrayerWidget.tsx`, the completed prayer indicator uses `text-chart-1` for the check icon. Change it to green.

### Change (line ~253-256)

In the progress row section, update the completed prayer circle styling:

**Current:**
```tsx
logged && !isMissed && 'bg-chart-1/20 border-chart-1/40 text-chart-1',
```

**New:**
```tsx
logged && !isMissed && 'bg-green-500/20 border-green-500/40 text-green-500',
```

Single line change, no other files affected.

