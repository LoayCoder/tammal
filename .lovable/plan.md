

# Wire Up the Endorsement Flow End-to-End

## How It Will Work (User Journey)

```text
Nominator submits nomination
  → Nomination saved with endorsement_status = 'pending'
  → Nomination card appears in "Sent" tab

Colleague visits My Nominations → "Endorse" tab (NEW)
  → Sees nominations awaiting endorsement (from myEndorsementRequests query)
  → Clicks a nomination → opens detail dialog
  → Fills EndorsementForm (relationship, statement, context)
  → Submits → endorsement count checked → if ≥2, nomination auto-advances to 'endorsed'

Alternatively: Nominator clicks their own nomination card
  → Opens detail view showing endorsement status + list of existing endorsements
```

## Changes

### 1. Add "Endorse" Tab to `MyNominationsPage.tsx`
- Add a 4th tab: "Endorse" with a `ThumbsUp` icon
- Consume `useEndorsements().myEndorsementRequests` to populate it
- Show nomination cards for items needing the current user's endorsement
- Each card has an "Endorse" button that opens a detail dialog

### 2. Create `NominationDetailDialog.tsx`
- A dialog that shows full nomination details (headline, justification, examples, impact metrics)
- Shows existing endorsements via `EndorsementListItem`
- If the current user hasn't endorsed yet and isn't the nominee/nominator, renders `EndorsementForm`
- Reuse existing `EndorsementForm` and `EndorsementListItem` components from `EndorsementCard.tsx`

### 3. Make `NominationCard` Clickable
- In both "Sent" and "Received" tabs, clicking a card opens `NominationDetailDialog`
- "Sent" view shows endorsement progress (count badge)
- "Received" view shows who endorsed

### 4. Remove Wizard Step 4 (Endorsements)
- The wizard's endorsement step is misleading — endorsements happen **after** submission by **other** people
- Remove `'endorsements'` from `STEPS` array, making the flow: `select_nominee → justification → criteria_evaluation → review`
- This matches the stated behavior: "Endorsements can be requested after submission"

### 5. Resolve Employee Names
- Fetch employee names for endorser IDs to display in `EndorsementListItem`

### 6. Localization
- Add keys for the new "Endorse" tab, empty states, and dialog labels in `en.json` and `ar.json`

## Files

| File | Action |
|------|--------|
| `src/pages/recognition/MyNominationsPage.tsx` | Add "Endorse" tab, integrate detail dialog |
| `src/components/recognition/NominationDetailDialog.tsx` | **New** — full nomination view + endorsement form |
| `src/components/recognition/NominationWizard.tsx` | Remove `endorsements` step from STEPS array |
| `src/locales/en.json` | Add endorsement tab/dialog keys |
| `src/locales/ar.json` | Add endorsement tab/dialog keys |

