

## Plan: Allow Managers to Add Extra Endorsers When Approving

### What
When a manager approves a nomination, allow them to optionally select additional colleagues as endorsers — reusing the existing `EndorsementRequestPicker` component. The picker appears inline on the approval card (toggled via a button), and any selected endorsers are submitted alongside the approval action.

### Changes

**1. `ManagerApprovalCard.tsx`** — Add endorser picker section
- Add a collapsible `EndorsementRequestPicker`-like section (reuse the employee list pattern) with a toggle button ("Add Additional Endorsers")
- Track `additionalEndorserIds: Set<string>` in state
- Pass these IDs to `onApprove` alongside criteria adjustments

**2. Update `onApprove` signature** — Both in `ManagerApprovalCard` props and `NominationApprovalsPage`
- Extend to accept optional `additionalEndorserIds: string[]`
- Pass through to the mutation

**3. `useNominationApprovals.ts` — `approveNomination` mutation**
- Accept optional `additionalEndorserIds: string[]`
- After approval update, insert new rows into `endorsement_requests` for each additional endorser
- Send `recognition_notifications` for the new endorsers (since approval is already done, notifications go immediately)

**4. Translations** — Add keys for the new UI
- `en.json`: `"addAdditionalEndorsers"`, `"managerAddedEndorsers"`
- `ar.json`: Arabic equivalents

### Technical Details
- Reuse employee fetching via `useEmployees()` hook inside the card
- Filter out: nominee, nominator, current user, and already-requested endorsers (fetch existing `endorsement_requests` for this nomination)
- No DB schema changes needed — `endorsement_requests` table already supports `requested_by` which will be the manager's user_id

