

## Plan: Prevent Duplicate Nominations for Same Nominee in Same Cycle

The user wants to enforce that the same nominee cannot be nominated more than once per cycle (by the same nominator), regardless of theme. This means the "Nominate for Different Theme" button should be removed, and the nomination wizard should block selecting a nominee who has already been nominated in the same cycle.

### Changes

**1. `src/components/recognition/NominationDetailDialog.tsx`**
- Remove the "Nominate for Different Theme" button and its separator (lines 198-210)
- Remove the `Trophy` icon import and `useNavigate` import if no longer needed

**2. `src/components/recognition/NominationWizard.tsx`**
- Add a query to fetch existing nominations by the current user in the current cycle
- Extract nominated `nominee_id`s into a `Set`
- Filter the employee list in the nominee selection step to exclude already-nominated users
- Show a message if the selected preselectedNomineeId is already nominated

**3. `src/pages/recognition/NominatePage.tsx`**
- Remove `preselectedNomineeId` prop passing (no longer needed since the "different theme" flow is removed)
- Can keep the `nominee` search param reading but it becomes unused; clean it up

### No database changes needed.

