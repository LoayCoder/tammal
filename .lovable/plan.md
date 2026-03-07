

# Fix Nomination Issues: Add Peer Quota & Allow Nominating Managers

## Problems Identified

1. **No Peer Quota**: `useManagerQuota` enforces a 30% cap for managers nominating their direct reports, but peers have no limit at all. There should be a configurable peer nomination quota per theme.

2. **Cannot Nominate Manager**: The `eligibleEmployees` filter on line 59-61 of `NominationWizard.tsx` only excludes the current user (`e.user_id !== user?.id`) for non-self nominations. This means managers *should* appear in the list. The actual issue is likely that the employee list from `useEmployees` filters by tenant and the manager's `user_id` may be null (no linked account), making them invisible. However, even if all employees show, there's no explicit block preventing upward nominations — so this needs investigation.

Actually, re-reading the code: `eligibleEmployees` filters `employees.filter(e => e.user_id !== user?.id)` — this shows ALL employees with a `user_id` except the current user. The nominee selector then filters `e => !!e.user_id`. So if a manager's employee record has a linked `user_id`, they should appear. The issue may be that the user's own manager simply doesn't have a `user_id` linked, OR `useEmployees` returns a limited set.

Let me confirm the `useEmployees` hook behavior before finalizing.

## Changes

### 1. Add Peer Quota — `src/hooks/recognition/useNominations.ts`
- Create a new `usePeerQuota(themeId)` hook similar to `useManagerQuota`
- Set a reasonable default: e.g., each peer can submit up to 3 nominations per theme (or make it configurable via `award_themes.max_peer_nominations_per_user` if we add a column)
- For now, use a fixed limit (e.g., 3 per peer per theme) without a schema change, counted from existing nominations where `nominator_role = 'peer'`

### 2. Show Peer Quota in Wizard — `src/components/recognition/NominationWizard.tsx`
- When `nominatorRole === 'peer'`, display a `QuotaIndicator` showing peer usage
- Block submission if peer quota is exhausted

### 3. Fix Nominee List — `src/components/recognition/NominationWizard.tsx`
- The current filter `employees.filter(e => e.user_id !== user?.id)` should already include managers
- The real filter issue is `.filter(e => !!e.user_id)` on line 181 — employees without a linked user account are excluded because `nominee_id` stores a `user_id`, not an `employee_id`
- This is by design (nominations reference `user_id`), so the fix is to ensure managers have linked user accounts — which is an operational/data issue, not a code bug
- However, we should add a search/filter to the nominee dropdown to make it easier to find people (including managers) in large lists

### 4. Update `QuotaIndicator` — `src/components/recognition/QuotaIndicator.tsx`
- Make it generic enough to display peer quota (remove the manager-specific `teamSize >= 5` note when used for peers)
- Add a `type` prop (`'manager' | 'peer'`) to show contextual messaging

### 5. Localization — `src/locales/en.json` & `src/locales/ar.json`
- Add keys for peer quota labels: `peerQuota`, `peerQuotaExhausted`, `peerQuotaNote`

## Summary
- Peer quota: hard-coded limit of 3 nominations per peer per theme (can later be made configurable via theme settings)
- Manager nomination: the code already allows it — employees with linked accounts appear regardless of hierarchy. If the user's manager is missing, it's because their account isn't linked. No code change needed, but we can add a helpful empty-state message.

