

## Plan: Add Theme Display & "Nominate for Different Theme" Action to Nomination Detail Dialog

### What changes

**1. Show the theme name in `NominationDetailDialog`** — fetch the theme from `award_themes` using `nomination.theme_id` and display it in the meta info block (alongside nominee, nominator, date).

**2. Add a "Nominate for Different Theme" button** — at the bottom of the dialog, show a button that navigates the user to `/recognition/nominate?cycle={cycle_id}&nominee={nominee_id}` pre-filling the cycle and nominee so they can pick a different theme and submit a new nomination for the same person.

### Files to modify

**`src/components/recognition/NominationDetailDialog.tsx`**
- Add a `useQuery` to fetch the theme name from `award_themes` by `nomination.theme_id`
- Display theme name as a new row in the meta info card (with a `Tag` icon)
- Add `useNavigate` from react-router-dom
- Add a "Nominate for Different Theme" button below endorsements that navigates to the nominate page with pre-filled cycle & nominee query params
- Close dialog on navigation

**`src/pages/recognition/NominatePage.tsx`**
- Read `nominee` from search params so the wizard can pre-select the nominee
- Pass `preselectedNomineeId` to `NominationWizard`

**`src/components/recognition/NominationWizard.tsx`** (minor)
- Accept optional `preselectedNomineeId` prop and pass it to the nominee selection step so it's pre-filled

### No database changes needed.

