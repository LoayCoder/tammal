

## Fix: Timeline Not Reflecting Actual Cycle Status

### Problem
`CycleTimeline` determines past/current phases purely by comparing dates to `now()`. When an admin manually advances a cycle (e.g., to "announced" before the endorsement deadline), the timeline still highlights the endorsement phase as "current" because its date hasn't passed yet.

### Solution
Map the cycle's `status` to a phase index. A phase is "past" if either its date has passed OR the cycle status has already moved beyond it. The "next" (pulsing) phase is the one matching the current status.

**Status-to-phase mapping:**
| Status | Completed through phase index |
|---|---|
| configuring | -1 (none) |
| nominating | 0 (nomination_start passed) |
| voting | 3 (voting_start reached) |
| calculating | 4 (voting_end reached) |
| announced | 5 (announcement reached) |
| archived | 5 (all done) |

### File: `src/components/recognition/CycleTimeline.tsx`

Replace the date-only logic with a status-aware approach:

```typescript
// Map cycle status to the minimum phase index that must be "past"
const STATUS_PHASE_INDEX: Record<string, number> = {
  configuring: -1,
  nominating: 0,   // nomination_start is past
  voting: 3,       // voting_start is past
  calculating: 4,  // voting_end is past
  announced: 5,    // announcement is past
  archived: 5,
};

const statusPhaseIdx = STATUS_PHASE_INDEX[cycle.status] ?? -1;

// A phase is past if: date < now OR cycle status has moved beyond it
const isPast = date < now || idx <= statusPhaseIdx;
// "Next" = first non-past phase
const isNext = !isPast && (idx === 0 || /* previous is past */);
```

This ensures that when an admin manually advances to "announced", all 6 timeline dots show as past (dark), with none pulsing — correctly reflecting reality.

### No other files changed. No translations needed.

