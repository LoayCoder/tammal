

## Issue: Mental Tools Showing in Team Mode — Why & Fix

### What's Happening

The AI prompt in the Copilot edge function provides the **same wellness tools catalog** to all modes (Personal, Team, Organization). The AI is told to "match recommendations to the user's current state" but has no rule differentiating **which tools are appropriate per mode**.

In Team mode, the AI sees the team has overdue tasks and low check-ins, and recommends personal tools like "Thought Reframer" and "Breathing & Grounding" — tools a **manager cannot use on behalf of their team**. This is incorrect because:

- **Team mode** is for **manager intelligence** — the manager needs actions they can take for the team (redistribute workload, send check-in reminders, launch surveys), not personal wellness exercises.
- Showing personal self-help tools in Team mode is confusing and not actionable for a manager.

### Fix Plan

**File**: `supabase/functions/wellness-copilot/index.ts`

1. **Filter the wellness tools catalog by mode** before passing to the AI:
   - **Personal mode**: Include all wellness tools (mood tracker, breathing, journaling, etc.)
   - **Team mode**: Only include support resources (first aiders, crisis support) and manager-specific actions. Remove personal practice tools. Add team-relevant recommendations like "Send team check-in reminder", "Review team workload", "Launch wellness survey".
   - **Organization mode**: Only include org-level actions (launch survey, review analytics, review workload distribution).

2. **Update the AI prompt** with mode-specific recommendation rules:
   - Team mode: "Recommend manager actions (send check-in, review workload, redistribute tasks) — NOT personal wellness exercises"
   - Add team-specific action catalog entries with appropriate routes

3. **Add team-specific recommendation keys** to the catalog:
   - `team_checkin` → "Send Check-in Reminder" → route to team pulse action
   - `review_workload` → "Review Team Workload" → `/admin/workload/team`
   - `launch_survey` → "Launch Wellness Survey" → `/admin/surveys`

4. **Update `CopilotRecommendationsBlock.tsx`** — add icons for new team action keys (`Users`, `BarChart3`, `Send`).

### Files to Modify
1. `supabase/functions/wellness-copilot/index.ts` — mode-aware resource catalog + updated prompt rules
2. `src/features/wellness-copilot/components/CopilotRecommendationsBlock.tsx` — add team action icons

