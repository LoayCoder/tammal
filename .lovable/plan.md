

## Plan: Add Endorsement Requests to Employee Dashboard

### What
Add a card/section on the Employee Dashboard (`EmployeeHome`) that shows pending endorsement requests. Each card displays the nomination headline, nominee name, and an action button. Once the user endorses (or navigates to do so), the card disappears automatically since the hook filters out completed endorsements.

### Implementation

**1. Create `DashboardEndorsementRequests` component**
- New file: `src/components/dashboard/DashboardEndorsementRequests.tsx`
- Uses `useEndorsements()` hook to get `myEndorsementRequests` and `requestsPending`
- Resolves nominee names via a small employees query
- Renders a list of action cards (similar style to the Pending Surveys card — glass-card with icon, headline, nominee name, and a CTA)
- Clicking a card navigates to `/recognition/my-nominations` with `?tab=endorse`, or opens the `NominationDetailDialog` inline with endorsement form
- Simpler approach: each card links to `/recognition/my-nominations` (auto-switching to Endorse tab)
- Cards auto-hide because `myEndorsementRequests` filters out already-endorsed nominations

**2. Add to `EmployeeHome.tsx`**
- Import and render `<DashboardEndorsementRequests />` after the Pending Surveys card and before spiritual widgets
- Only renders when there are pending requests (component self-manages visibility)

**3. Auto-select Endorse tab on navigation**
- Update `MyNominationsPage` to read `?tab=endorse` from URL search params and set initial tab accordingly, so clicking from dashboard lands directly on the Endorse tab

### Technical Details
- The `useEndorsements` hook already filters: only shows nominations with `manager_approval_status: approved/not_required` and excludes already-endorsed ones — so cards auto-hide after action
- RTL: all spacing uses logical properties (`me-`, `ms-`, `ps-`, `pe-`, `text-start`)
- No new database changes needed

