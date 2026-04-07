

# Fix: Team Mode Copilot Recommendations Showing Admin-Only Actions

## Problem
The `teamTools` array in the `wellness-copilot` edge function includes **"Launch Wellness Survey"** pointing to `/admin/questions`. This is an admin/HR-only page — team managers cannot access it, resulting in a 404 or access block.

Similarly, the `orgTools` array has the same issue, but org mode is restricted to admins anyway, so that's fine.

## Fix

**File:** `supabase/functions/wellness-copilot/index.ts`

Replace the `launch_survey` entry in `teamTools` with a manager-appropriate action:

| Current (broken for managers) | Replacement |
|---|---|
| `{ key: "launch_survey", title: "Launch Wellness Survey", route: "/admin/questions" }` | `{ key: "view_insights", title: "View Engagement Insights", route: "/engagement-insights" }` |

The updated `teamTools` array becomes:
```
team_checkin  → /engagement-insights  (Send Check-in Reminder)
review_workload → /my-workload         (Review Team Workload)
team_pulse    → /engagement-insights  (View Team Pulse)
view_insights → /engagement-insights  (View Engagement Insights)
```

All four routes are accessible to managers. The "Launch Survey" action stays in `orgTools` only — where it belongs (admins only).

**Deployment:** Redeploy `wellness-copilot` edge function + clear stale cache entries referencing `/admin/questions` in team-mode insights.

