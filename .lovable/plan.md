
Fix the team-mode “Send Check-in Reminder” recommendation so it opens a manager-actionable workflow instead of analytics.

What I found
- In `supabase/functions/wellness-copilot/index.ts`, the team recommendation `team_checkin` currently routes to `/engagement-insights`.
- `/engagement-insights` (`src/pages/EngagementInsights.tsx`) is an analytics/details page. It does not contain the actual check-in sending action.
- The real manager action already exists in `src/features/team-pulse/components/TeamMemberActions.tsx` via `handleCheckIn()`, which sends a `check_in_prompt` notification.
- That UI is only available inside `TeamMemberRiskGrid` → `TeamPulseCard`, which is rendered on `/dashboard`.

Plan
1. Correct the recommendation target
- Update the team-mode `team_checkin` destination in `supabase/functions/wellness-copilot/index.ts`.
- Replace `/engagement-insights` with a dashboard deep link such as:
```text
/dashboard?focus=team-pulse&mode=team
```

2. Make the deep link open the right state
- Add URL-param handling so opening that link:
  - lands on `/dashboard`
  - switches `TeamPulseCard` into `team` mode
  - scrolls/highlights the Team Pulse card so the manager can act immediately

3. Keep old cached responses working
- Extend `normalizeRecommendationRoute()` in `src/features/wellness-copilot/hooks/useCopilotInsight.ts` so any stale team `team_checkin` route still coming back as `/engagement-insights` or `/team-pulse` is remapped to the new dashboard deep link.

4. Refresh stale server data
- Redeploy the `wellness-copilot` function.
- Clear cached team copilot insights that still contain the old `team_checkin` route so users stop receiving outdated links.

5. Verify the exact flow
- Team manager clicks “Send Check-in Reminder”
- App opens dashboard Team Pulse in team mode
- Manager sees the member action buttons and can send a check-in
- No redirect to `/engagement-insights`
- Org/admin-only actions like survey launch remain unchanged

Technical details
- Files likely involved:
  - `supabase/functions/wellness-copilot/index.ts`
  - `src/features/wellness-copilot/hooks/useCopilotInsight.ts`
  - `src/features/team-pulse/hooks/usePulseModes.ts`
  - `src/features/team-pulse/components/TeamPulseCard.tsx`
  - possibly `src/pages/Dashboard.tsx` if temporary URL-driven tab selection is needed
- This fixes the UX at the root: the recommendation will point to the existing manager action surface instead of a read-only analytics page.
