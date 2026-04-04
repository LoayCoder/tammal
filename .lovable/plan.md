

## Move Pending Surveys Card Above Daily Check-in

### What Changes

**`src/pages/EmployeeHome.tsx`**

- **Move** the Pending Surveys block (lines 158-176) from its current position (after Workload widget) to **above** the Inline Daily Check-in (before line 131)
- **Upgrade styling** to premium VIP treatment:
  - Use `cardVariants.premiumVip` instead of `cardVariants.premium`
  - Add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` for smooth interaction
  - Add a subtle pending count badge (`Badge` with `variant="secondary"`) showing the number of surveys
  - Increase icon container to use a softer gradient tint (`from-chart-2/10 to-chart-2/5`)
  - Use `rounded-2xl` on the card

The new order after Support Hub will be:
1. Support Hub (collapsible)
2. Endorsement Requests
3. Shortlist Widget
4. Voting Widget
5. **Pending Surveys** ← moved here
6. Daily Check-in / Completed indicator
7. Prayer Widget
8. Workload
9. Tools / Resources / Mood Dashboard

### Files Modified
| File | Change |
|------|--------|
| `src/pages/EmployeeHome.tsx` | Move survey card above check-in, upgrade to premiumVip styling with hover effects |

