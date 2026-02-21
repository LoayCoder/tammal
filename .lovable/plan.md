

# Fix: Filter Out Inactive Batches from Schedule Dropdown

## Problem
The "Question Batches" dropdown in the Schedule Management dialog shows **all** batches matching the schedule type (survey/wellness), including ones with `inactive` status. Only `published` batches should appear since the delivery system requires published batches.

## Change

### File: `src/pages/admin/ScheduleManagement.tsx` (line ~740-741)

Update the batch filter to also check for `published` status:

```text
// Before
const filteredBatches = batches.filter(b =>
  scheduleType === 'daily_checkin' ? b.purpose === 'wellness' : b.purpose === 'survey'
);

// After
const filteredBatches = batches.filter(b => {
  const matchesPurpose = scheduleType === 'daily_checkin' ? b.purpose === 'wellness' : b.purpose === 'survey';
  return matchesPurpose && b.status === 'published';
});
```

This single change ensures:
- Only **published** batches appear in the dropdown
- Draft and inactive batches are excluded
- The filter still respects the schedule type (wellness for daily check-in, survey for survey)
