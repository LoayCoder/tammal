

# Fix: Filter Generation Period Dropdown by Schedule Type

## Problem
When creating or editing a Schedule, the Generation Period dropdown shows ALL active periods regardless of their purpose. This means a "Daily Check-in" schedule can be linked to a "Survey" period and vice versa, which causes data integrity issues -- questions from the wrong purpose get linked to the schedule.

## Solution
Filter the Generation Period dropdown options by matching the period's `purpose` field to the selected `scheduleType`:
- `scheduleType === 'daily_checkin'` should only show periods where `purpose === 'wellness'`
- `scheduleType === 'survey'` should only show periods where `purpose === 'survey'`

## Technical Details

### File: `src/pages/admin/ScheduleManagement.tsx`

**Line 702** -- Change the filter from:
```text
periods.filter(p => p.status === 'active')
```
To:
```text
periods.filter(p => p.status === 'active' && p.purpose === (scheduleType === 'daily_checkin' ? 'wellness' : 'survey'))
```

Additionally, when the user changes `scheduleType` (the radio toggle on lines 660-675), the currently selected `linkedPeriodId` should be cleared if it no longer matches the new type. This prevents stale links.

**In the `scheduleType` radio group's `onValueChange` handler** -- add logic to reset `linkedPeriodId` when switching types:
- Clear `linkedPeriodId` to `null`
- Clear `startDate` and `endDate` if they were auto-populated from a period

This is a small, targeted change -- two modifications in one file.
