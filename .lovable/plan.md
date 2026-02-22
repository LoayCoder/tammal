

# Breathing & Grounding Module -- Full Upgrade + Dashboard Integration

## Overview

Transform the current breathing module from a simple timer into a clinically-aligned, data-driven wellness experience with database-backed session tracking, mood tagging, configurable sessions, and full analytics integration into the personal dashboard (MoodTrackerPage).

---

## Audit Findings (Current State)

| # | Issue | Severity |
|---|---|---|
| 1 | **No data persistence** -- sessions are not tracked at all (no DB table, no localStorage) | Critical |
| 2 | **No dashboard integration** -- breathing activity is invisible in the personal dashboard | Critical |
| 3 | **Hardcoded English strings** -- "Next", "Finish", "Start Over", "Step X of 5", "Ground yourself..." are not translated | Medium |
| 4 | **Hardcoded 5 rounds** -- no way to adjust session length or breathing durations | Medium |
| 5 | **No pause/resume** -- "Pause" button actually resets the entire session (calls `stop()`) | High |
| 6 | **Raw arrow character** -- "Next (right arrow)" in grounding step is not RTL-aware | Medium |
| 7 | **No mood tagging** -- no before/after mood capture for insight generation | Medium |
| 8 | **No completion encouragement** -- completion screen is bare (just an emoji and "Start Over") | Low |
| 9 | **No audio guidance** -- no optional ambient tone or breath cue sounds | Low |
| 10 | **`Inhale again` label** not translated for Physiological Sigh technique | Medium |
| 11 | **Timer logic race condition** -- `setTimeLeft` and `setPhaseIdx` updates can conflict because `phaseIdx` in the closure is stale | Medium |

---

## Implementation Plan

### Phase 1: Database Table + Migration

Create a `breathing_sessions` table to track every completed (or abandoned) session.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `employee_id` | uuid NOT NULL | Links to `employees.id` |
| `tenant_id` | uuid NOT NULL | For RLS |
| `technique` | text NOT NULL | `box`, `sigh`, or `grounding` |
| `duration_seconds` | integer NOT NULL | Total session time in seconds |
| `rounds_completed` | integer | Rounds finished (for box/sigh) |
| `rounds_target` | integer | Target rounds configured |
| `mood_before` | integer | 1-5 mood score before session |
| `mood_after` | integer | 1-5 mood score after session |
| `completed` | boolean DEFAULT false | Whether the session was fully completed |
| `created_at` | timestamptz DEFAULT now() | |
| `deleted_at` | timestamptz | Soft delete |

**RLS Policies** (mirroring `thought_reframes` pattern):
- Employees can INSERT their own sessions
- Employees can SELECT their own sessions (where `deleted_at IS NULL`)
- Employees can UPDATE their own sessions (for mood_after + completion)
- Super admins can manage all
- Tenant admins can view tenant sessions

**Indexes:**
- `idx_breathing_sessions_employee` on `(employee_id, created_at)`
- `idx_breathing_sessions_tenant` on `(tenant_id, created_at)`

---

### Phase 2: New Hook -- `src/hooks/useBreathingSessions.ts`

- `sessions` -- fetched from DB, ordered by `created_at DESC`, limited to 100
- `startSession(data)` -- inserts a new row with `mood_before`, technique, target rounds; returns the session ID
- `completeSession(id, moodAfter, roundsCompleted, durationSeconds)` -- updates the row
- `stats` -- derived from fetched data:
  - `totalSessions` (completed only)
  - `totalMinutes` (sum of `duration_seconds / 60`)
  - `currentStreak` (consecutive days with at least 1 completed session)
  - `longestStreak`
  - `thisWeekSessions`
  - `thisMonthSessions`
  - `avgMoodImprovement` (average of `mood_after - mood_before` where both exist)
  - `favoriteExercise` (most-used technique)
  - `weeklyData` (last 7 days, count per day for bar chart)

---

### Phase 3: Redesigned Page -- `src/pages/mental-toolkit/BreathingPage.tsx`

The page becomes the full experience (replaces the simple wrapper).

**A. Page Header** -- keeps existing gradient banner style

**B. Stats Bar** -- 4 small KPI pills:
- Total Sessions | Total Minutes | Current Streak | Avg Mood Improvement

**C. Pre-Session Setup** (new, shown before starting):
- **Technique selector** (existing, refined with descriptions for each technique)
- **Session length selector**: Short (3 rounds), Medium (5 rounds), Long (8 rounds) -- or Beginner/Intermediate/Advanced labels
- **Mood before** prompt: 5 emoji row (uses tenant mood definitions) asking "How are you feeling right now?"

**D. Active Session** (redesigned `BreathingGroundingTool`):
- Fix pause/resume (true pause, not reset)
- Animated breathing circle with smooth CSS transitions (existing, refined)
- Clear phase label (Inhale/Hold/Exhale) with countdown timer
- Progress indicator: visual round counter (dots or ring)
- All strings translated
- RTL-aware navigation arrows for grounding steps

**E. Post-Session** (new completion flow):
- Celebration screen with gentle animation
- **Mood after** prompt: same 5 emoji row
- Encouragement message based on mood change (improved, same, declined)
- "Practice again" + "View history" buttons
- Auto-saves session to DB on completion

**F. Session History** (new section below the tool):
- Scrollable list of recent sessions as cards (date, technique, duration, mood change)
- Empty state when no sessions exist

---

### Phase 4: Dashboard Integration -- `usePersonalMoodDashboard.ts`

Add a new query block (same pattern as `reframeStats`):

```text
breathingStats: {
  totalSessions, totalMinutes, currentStreak,
  avgMoodImprovement, thisMonth, favoriteExercise
}
```

Fetches from `breathing_sessions` table filtered by `employee_id`.

---

### Phase 5: Dashboard UI -- `MoodTrackerPage.tsx`

Add a new **"Breathing Activity"** card (same layout as the Reframe Activity card):
- 3 KPI values: Total Sessions | This Month | Current Streak
- Average Mood Improvement indicator
- "Go to Breathing" link with RTL-aware arrow

---

### Phase 6: Localization

New keys in `en.json` and `ar.json` under `mentalToolkit.breathing`:
- `moodBeforePrompt`: "How are you feeling right now?"
- `moodAfterPrompt`: "How do you feel now?"
- `sessionLength`: "Session Length"
- `beginner`: "Beginner (3 rounds)"
- `intermediate`: "Intermediate (5 rounds)"
- `advanced`: "Advanced (8 rounds)"
- `next`: "Next"
- `finish`: "Finish"
- `startOver`: "Start Over"
- `step`: "Step {{current}} of {{total}}"
- `groundingIntro`: "Ground yourself by engaging all 5 senses"
- `inhaleAgain`: "Inhale Again"
- `longExhale`: "Long Exhale"
- `encouragementImproved`: "Your mood improved! Keep practicing."
- `encouragementSame`: "Consistency matters. Great job showing up."
- `encouragementDeclined`: "It's okay to not feel better right away. You showed up, and that matters."
- `practiceAgain`: "Practice Again"
- `viewHistory`: "Session History"
- `noSessionsYet`: "No sessions yet"
- `noSessionsDesc`: "Complete your first breathing exercise to start tracking"
- `totalSessions`: "Total Sessions"
- `totalMinutes`: "Total Minutes"
- `avgImprovement`: "Avg Improvement"
- `favoriteExercise`: "Most Used"

Under `mentalToolkit.moodDashboard`:
- `breathingActivity`: "Breathing Activity"
- `breathingSessions`: "Sessions"
- `breathingThisMonth`: "This Month"
- `breathingStreak`: "Streak"
- `goToBreathing`: "Go to Breathing"

---

## Files Summary

| Action | File |
|---|---|
| Migration | New `breathing_sessions` table with RLS + indexes |
| New | `src/hooks/useBreathingSessions.ts` -- DB CRUD + stats |
| Rewrite | `src/pages/mental-toolkit/BreathingPage.tsx` -- full page with setup, session, completion, history |
| Rewrite | `src/components/mental-toolkit/tools/BreathingGroundingTool.tsx` -- fix pause/resume, translate all strings, RTL arrows, accept props for round config + callbacks |
| Modify | `src/hooks/usePersonalMoodDashboard.ts` -- add breathing stats query |
| Modify | `src/pages/mental-toolkit/MoodTrackerPage.tsx` -- add Breathing Activity card |
| Modify | `src/locales/en.json` -- new translation keys |
| Modify | `src/locales/ar.json` -- new translation keys |

---

## Design System

- Lavender (#C9B8E8) for breathing phases, Sage Green (#A8C5A0) for completion states
- Deep Plum (#4A3F6B) for text accents
- Rounded cards (rounded-2xl), soft shadows
- All spacing uses logical properties (ms-/me-/ps-/pe-)
- RTL-aware arrows using Lucide icons with `rtl:-scale-x-100`
- Smooth fade-in transitions between session states

