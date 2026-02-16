

# Add Filters and Analytics to Scheduled Questions Preview

## Overview
Enhance the "View Scheduled Questions" dialog with interactive filters and a toggleable analytics/charts section.

## Changes

### 1. Add Filter Controls (ScheduleManagement.tsx)
Add a filter bar above the preview table with three filters:
- **Date Range**: Two date inputs (from/to) filtering on `scheduled_delivery`
- **Status**: A multi-select dropdown with options: pending, delivered, answered, skipped, expired, failed
- **Employee**: A searchable select dropdown populated from the fetched preview data's unique employees

New state variables:
- `previewFilterDate: { from: string; to: string }`
- `previewFilterStatus: string[]`
- `previewFilterEmployee: string`

The table will be filtered client-side using `useMemo` over `previewQuestions`.

### 2. Add Analytics Toggle Button and Charts
Add a "Show Analytics" button in the dialog header area. When clicked, a collapsible section appears above the table showing:

- **Status Distribution**: A pie/donut chart (using Recharts) showing count by status (pending, delivered, answered, skipped)
- **Delivery Timeline**: A bar chart showing questions per day based on `scheduled_delivery`
- **Summary Cards**: Total questions, answered rate %, pending count

These charts react to the active filters -- so filtering by employee shows that employee's analytics only.

### 3. Remove the 50-row limit
Increase the query limit to 500 to provide meaningful analytics data.

## Technical Details

### New State
```typescript
const [previewFilterDateFrom, setPreviewFilterDateFrom] = useState('');
const [previewFilterDateTo, setPreviewFilterDateTo] = useState('');
const [previewFilterStatus, setPreviewFilterStatus] = useState<string[]>([]);
const [previewFilterEmployee, setPreviewFilterEmployee] = useState('');
const [showAnalytics, setShowAnalytics] = useState(false);
```

### Filtered Data (useMemo)
```typescript
const filteredPreview = useMemo(() => {
  return previewQuestions.filter(sq => {
    if (previewFilterDateFrom && sq.scheduled_delivery < previewFilterDateFrom) return false;
    if (previewFilterDateTo && sq.scheduled_delivery > previewFilterDateTo + 'T23:59:59') return false;
    if (previewFilterStatus.length && !previewFilterStatus.includes(sq.status)) return false;
    if (previewFilterEmployee && sq.employee?.id !== previewFilterEmployee) return false;
    return true;
  });
}, [previewQuestions, previewFilterDateFrom, previewFilterDateTo, previewFilterStatus, previewFilterEmployee]);
```

### Chart Data (useMemo)
```typescript
const statusChartData = useMemo(() => {
  const counts: Record<string, number> = {};
  filteredPreview.forEach(sq => { counts[sq.status] = (counts[sq.status] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}, [filteredPreview]);

const timelineChartData = useMemo(() => {
  const byDate: Record<string, number> = {};
  filteredPreview.forEach(sq => {
    const d = new Date(sq.scheduled_delivery).toLocaleDateString();
    byDate[d] = (byDate[d] || 0) + 1;
  });
  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}, [filteredPreview]);
```

### UI Layout in Preview Dialog
```
[Date From] [Date To] [Status ▼] [Employee ▼]  [Show Analytics]
─────────────────────────────────────────────────────────────────
(Collapsible Analytics Section - pie chart + bar chart + summary)
─────────────────────────────────────────────────────────────────
| Employee | Question | Delivery Date | Status |
| ...      | ...      | ...           | ...    |
```

### Files Modified
- `src/pages/admin/ScheduleManagement.tsx` -- add filters, analytics section, chart imports

### Dependencies Used (already installed)
- `recharts` -- for PieChart and BarChart
- `@/components/ui/chart` -- ChartContainer, ChartTooltip
- All Shadcn UI components already available

