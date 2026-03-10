

## What Should Happen After Nominating alshehri.sa@hotmail.com — And What's Missing

### Current State
- alshehri.sa@hotmail.com was nominated and the nomination is already **shortlisted** in an **announced** cycle
- The nominee has **zero recognition notifications** — they were never told they were nominated

### The Problem
The nomination workflow **never notifies the nominee** that they've been nominated. Notifications are only sent for:
- Endorsement requests (to endorsers)
- Manager approval flow

The nominee only discovers they were nominated if they manually navigate to My Nominations → Received tab.

### What Should Happen After Nomination

```text
Nomination Submitted
  ├─ [MISSING] Notify nominee: "You've been nominated!"
  ├─ If manager approval required → Manager gets approval card
  │     ├─ Manager approves → status: endorsed
  │     │     └─ [MISSING] Notify nominee: "Your nomination was approved"
  │     └─ Manager rejects → [MISSING] Notify nominee: "Nomination not approved"
  ├─ Endorsement requests sent to selected colleagues
  └─ When cycle results announced
        └─ [MISSING] Notify winners: "Congratulations! You won!"
```

### Proposed Fix: Add Missing Notifications

**1. Notify nominee on nomination submission** (`useNominations.ts`)
After creating a nomination, insert a `recognition_notification` for the nominee:
- Type: `nomination_received`
- Title: "{nominator name} nominated you!"
- Body: "You've been nominated for '{headline}'"

**2. Notify nominee on manager approval/rejection** (`useNominationApprovals.ts`)
After manager approves or rejects, notify the nominee:
- Approve type: `nomination_approved`
- Reject type: `nomination_rejected`

**3. Notify winners on results announcement** (`calculate-recognition-results/index.ts`)
After results are calculated, notify the top 3 nominees per theme:
- Type: `award_won`
- Title: "Congratulations! You placed #{rank}"

**4. Register new notification types in the bell** (`UnifiedNotificationBell.tsx`)
Add icons and colors for the new types: `nomination_received`, `nomination_approved`, `nomination_rejected`, `award_won`

**5. Add i18n keys** for all new notification strings

### Files to Change
- `src/hooks/recognition/useNominations.ts` — send nominee notification on create
- `src/hooks/recognition/useNominationApprovals.ts` — send nominee notification on approve/reject
- `supabase/functions/calculate-recognition-results/index.ts` — send winner notifications
- `src/components/notifications/UnifiedNotificationBell.tsx` — register new notification types
- Translation files (en/ar)

