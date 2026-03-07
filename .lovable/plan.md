

# Recognition & Awards Module — End-to-End Audit

## Audit Scope

Full lifecycle review across: Cycle Management, Nominations, Endorsements, Voting, Results Calculation, Appeals, Points Economy, and Redemption.

---

## Findings

### CRITICAL BUGS

**1. Nominee ID Mismatch — Nomination will always fail RLS or FK**
- `NominationWizard` sets `nominee_id` to `employee.id` (the employee record UUID), but the `nominations` table's `nominee_id` column references a **user UUID** (`auth.users.id`). The voting hook (`useVoting`) later queries `employees.user_id` to resolve nominee names, confirming the column expects `user_id`.
- The insert in `useNominations.createNomination` sends `nominee_id: nomineeId` where `nomineeId` comes from the employee selector — this is an employee record ID, not a user ID.
- **Impact**: Every nomination attempt will either insert wrong data or silently link to the wrong person.

**2. Self-Nomination Allows Nominating Others**
- In `NominationWizard` line 53: `eligibleEmployees = employees.filter(e => e.user_id !== user?.id || nominatorRole === 'self')`. When `nominatorRole === 'self'`, the filter lets ALL employees through (including others), but self-nomination should restrict to ONLY the current user.

**3. Calculate Results Edge Function Skips Cycle Status Validation**
- `calculate-recognition-results` (line 47) immediately sets status to `calculating` without checking current status. It should only run from `voting` status per `VALID_TRANSITIONS`. A race condition could cause double-calculation or run on an already-announced cycle.

**4. Calculate Results Bypasses RLS with Service Role Key**
- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` for all operations (correct for writes) but inserts `theme_results` and `nominee_rankings` — these tables' INSERT policies require admin role. Since the service role key bypasses RLS entirely, this works but means **no tenant isolation is enforced server-side** during calculation.

**5. Fairness Config Key Mismatch**
- The `buildFairnessConfig()` in `types.ts` produces keys like `biasDetection.cliqueThreshold`, but the edge function reads `fairnessConfig.clique_threshold` and `fairnessConfig.visibility_bias` (snake_case at the top level). The fairness settings configured in the UI are **never actually read** by the calculation engine.

### SECURITY ISSUES

**6. Votes SELECT Policy Too Broad**
- All authenticated tenant users can read ALL votes in their tenant (`Tenant read` policy). This means before results are announced, any employee can see how others voted — undermining ballot secrecy.

**7. Nominations DELETE Policy Allows Hard Delete**
- The `nominations` table has an RLS policy for `DELETE` cmd (`Admins can delete`), meaning admins can hard-delete nominations. Per project standards, only soft-delete is allowed.

**8. Points Self-Credit Vulnerability**
- `points_transactions` has a policy `Users can insert own points` allowing any authenticated user to insert points for themselves. The voting hook uses this for participation points, but a malicious user could call the Supabase API directly to credit arbitrary points.

### LOGIC ISSUES

**9. NominationCard Delete Button Never Fires**
- `NominationCard` shows a delete button only when `showActions && onDelete && nomination.status === 'draft'`. But `useNominations.createNomination` inserts with `status: 'submitted'` — nominations are never in `draft` status, so the delete button never appears.

**10. Nomination Wizard Submits on Step 2, Not Step 4**
- The wizard submits the nomination at the "justification" step (step 2), then shows endorsements (step 3) and review (step 4). But the review step just displays a success message if `createdNominationId` exists. The user sees "Submit Nomination" at step 2 and may not realize clicking it sends the nomination immediately.

**11. Manager Quota Queries `manager_id` Field**
- `useManagerQuota` checks `employees.manager_id = user.id` but `user.id` is an auth UUID, and `manager_id` likely references an employee record ID. This would return 0 team members, making quota checks meaningless.

**12. Results Page Instantiates `useResults` Twice**
- `RecognitionResults.tsx` calls `useResults(selectedCycleId)` on both line 32 and line 35. The second call creates a duplicate React Query subscription just to get `calculateResults`.

**13. Redemption Rejection Doesn't Refund Points**
- When admin rejects a redemption request (`updateRequest` with `status: 'rejected'`), the deducted points are not refunded. The `redeem_points` RPC already debited points atomically — rejection should credit them back.

### UX / MINOR ISSUES

**14. VotingBooth Initializes Scores Inside Render**
- Lines 82-86 of `VotingBooth.tsx` call `setScores()` during render (not in useEffect), which triggers a re-render loop warning in React strict mode.

**15. Endorsement Step is a Dead End**
- The endorsement step in the wizard just says "skip for now" with no actual endorsement functionality. `EndorsementForm` is imported but never rendered.

**16. Missing `deleted_at IS NULL` Filter on Votes**
- `useVoting` line 100-104 queries existing votes without filtering `deleted_at`, which could show stale data if votes table has soft-delete.

---

## Implementation Plan

### Step 1: Fix Nominee ID Mapping (Critical)
- **Edit** `src/components/recognition/NominationWizard.tsx`: Change nominee selection to use `employee.user_id` as the value, not `employee.id`. Update `nominee_department_id` lookup accordingly.

### Step 2: Fix Self-Nomination Filter
- **Edit** `NominationWizard.tsx`: When `nominatorRole === 'self'`, filter to only show the current user's employee record.

### Step 3: Fix Fairness Config Key Mapping
- **Edit** `supabase/functions/calculate-recognition-results/index.ts`: Read from `fairnessConfig.biasDetection.cliqueThreshold` instead of `fairnessConfig.clique_threshold`. Add cycle status validation before proceeding.

### Step 4: Restrict Vote Visibility
- **Migration**: Replace `votes` SELECT policy with one that only allows users to see their own votes, plus admins see all. Votes should be secret until results are published.

### Step 5: Remove Hard DELETE Policy on Nominations
- **Migration**: Drop the `Admins can delete` policy on `nominations`. Admins already use soft-delete via the UPDATE policy.

### Step 6: Restrict Points Self-Insert
- **Migration**: Replace `Users can insert own points` policy to only allow negative amounts or specific source types, preventing self-crediting. Better: remove the policy entirely and have all point grants go through server-side functions.

### Step 7: Fix Nomination Status & Delete Button
- **Edit** `NominationCard.tsx`: Allow delete for `submitted` status too (via soft-delete).
- OR change the wizard flow so drafts are saved first, then explicitly submitted.

### Step 8: Fix Manager Quota Query
- **Edit** `useNominations.ts`: Change `manager_id` comparison to use the current user's employee ID, not their auth user ID.

### Step 9: Fix Redemption Rejection Refund
- **Edit** `useRedemption.ts` or create a database function: When status changes to `rejected`, insert a credit `points_transaction` to refund the deducted points.

### Step 10: Fix VotingBooth Score Init
- **Edit** `VotingBooth.tsx`: Move initial score setup into a `useEffect`.

### Step 11: Fix Duplicate useResults Call
- **Edit** `RecognitionResults.tsx`: Remove the duplicate `useResults` call on line 35.

### Step 12: Minor Cleanups
- Add `deleted_at IS NULL` filter on votes queries
- Add `EndorsementForm` rendering in wizard endorsement step (or remove dead import)

---

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/components/recognition/NominationWizard.tsx` |
| Edit | `src/components/recognition/NominationCard.tsx` |
| Edit | `src/components/recognition/VotingBooth.tsx` |
| Edit | `src/hooks/recognition/useNominations.ts` |
| Edit | `src/hooks/recognition/useVoting.ts` |
| Edit | `src/hooks/recognition/useRedemption.ts` |
| Edit | `src/pages/admin/RecognitionResults.tsx` |
| Edit | `supabase/functions/calculate-recognition-results/index.ts` |
| Migration | Fix votes SELECT, nominations DELETE, points INSERT policies |
| Migration | Add refund trigger/function for rejected redemptions |

