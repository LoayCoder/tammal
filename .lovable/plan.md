

# Fix: Copilot Recommendation Cards Leading to 404

## Root Cause
The `wellness-copilot` edge function returns hardcoded routes that **do not exist** in the app's router:

| Recommendation | Route in Edge Function | Actual Route |
|---|---|---|
| Send Check-in Reminder | `/team-pulse` | `/engagement-insights` |
| Review Team Workload | `/my-workload` | `/my-workload` ✅ (OK) |
| View Team Pulse | `/team-pulse` | `/engagement-insights` |
| Launch Wellness Survey | `/admin/surveys` | `/admin/questions` |
| Launch Organization Survey | `/admin/surveys` | `/admin/questions` |
| Review Wellness Analytics | `/admin/wellness-analytics` | `/admin/analytics` or `/engagement-insights` |
| Review Workload Distribution | `/admin/workload` | `/admin/workload/dashboard` |
| View Organization Pulse | `/team-pulse` | `/engagement-insights` |

## Fix
Update the `teamTools` and `orgTools` arrays in **`supabase/functions/wellness-copilot/index.ts`** with the correct routes:

| Key | Corrected Route |
|---|---|
| `team_checkin` | `/engagement-insights` |
| `team_pulse` | `/engagement-insights` |
| `launch_survey` | `/admin/questions` |
| `org_analytics` | `/engagement-insights` |
| `review_workload` (org) | `/admin/workload/dashboard` |

**File:** `supabase/functions/wellness-copilot/index.ts` — update ~6 route strings in the `teamTools` and `orgTools` arrays.

