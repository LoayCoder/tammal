

## Plan: Move Endorsement Requests Above Daily Check-in

Move `<DashboardEndorsementRequests />` (line 131) to just before the Daily Check-in section (before line 82).

**File:** `src/pages/EmployeeHome.tsx`
- Remove lines 130-131 (`{/* Pending Endorsement Requests */}` + `<DashboardEndorsementRequests />`)
- Insert them before line 82 (`{/* Inline Daily Check-in */}`)

Single reorder, no logic changes.

