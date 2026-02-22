

# Thought Reframer -- Full Redesign & Database Integration

## Overview

Redesign the Thought Reframer page from a localStorage-only CBT tool into a **fully database-integrated**, polished experience. Reframe entries will be persisted to a new `thought_reframes` table, and a **Reframe Insights** section will appear on the personal Mood Dashboard showing the user's reframing activity stats.

---

## Current Problems

1. **localStorage only** -- entries are lost on device switch, not part of the employee's wellness profile
2. **No dashboard integration** -- the personal mood dashboard has no visibility into reframing activity
3. **Basic UI** -- hardcoded "Step X of 3" text, small plain textareas, bland summary card, no animations
4. **RTL gaps** -- arrow symbols (arrow, back) are not RTL-aware; `borderLeft` used instead of logical properties
5. **No delete capability** -- past reframes cannot be removed
6. **Limited history** -- only shows last 5 entries in a collapsed accordion

---

## What Will Change

### 1. New Database Table: `thought_reframes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `employee_id` | uuid NOT NULL | FK concept (no explicit FK to auth) |
| `tenant_id` | uuid NOT NULL | For RLS |
| `negative_thought` | text NOT NULL | The original thought |
| `challenge_answers` | jsonb | `{q1: "...", q2: "...", q3: "..."}` |
| `reframed_thought` | text NOT NULL | The reframed version |
| `created_at` | timestamptz | Default `now()` |
| `deleted_at` | timestamptz | Soft delete |

**RLS Policies** (same pattern as `mood_entries`):
- Employees can INSERT their own entries
- Employees can SELECT their own entries (where `deleted_at IS NULL`)
- Employees can UPDATE their own entries (for soft delete)
- Super admins can manage all
- Tenant admins can view tenant entries

### 2. New Hook: `src/hooks/useThoughtReframes.ts`

- `reframes` -- fetched from DB, ordered by `created_at DESC`, limited to 50
- `saveReframe(data)` -- inserts to DB using `useMutation` with cache invalidation
- `deleteReframe(id)` -- soft-deletes (sets `deleted_at`) with `useMutation`
- `stats` -- derived: total count, this month count, this week count, current streak (consecutive days with at least one reframe)

### 3. Redesigned Page: `src/pages/mental-toolkit/ThoughtReframerPage.tsx`

The page itself becomes the full experience (no longer just a wrapper for `ThoughtReframerTool`).

**Layout:**

**A. Page Header** -- gradient banner with icon, title, subtitle (keep existing style)

**B. Stats Bar** (new) -- 3 small KPI pills below the header:
- Total Reframes (all time)
- This Month count
- Current Streak (consecutive days)

**C. Reframe Wizard** (redesigned multi-step flow):
- Step indicators as **numbered circles** with connecting lines (not just a progress bar)
- Step 1: "Identify the Thought" -- larger textarea with a thought-bubble icon, calming background
- Step 2: "Challenge It" -- 3 guided questions in styled cards with question-mark icons
- Step 3: "Reframe" -- shows original in a lavender quote card, textarea below with sage-green accent
- Summary: side-by-side comparison cards with a "transformation arrow" between them, confetti-style save animation

**D. Reframe Journal** (replaces accordion) -- scrollable list of past reframes:
- Each entry as a card with date, original thought (truncated), reframed thought
- Expand to see the full challenge answers
- Delete button (trash icon) with confirmation
- Empty state with illustration when no entries exist
- "View more" pagination (loads 10 at a time)

### 4. Dashboard Integration: Update `usePersonalMoodDashboard.ts`

Add a new query to fetch reframe stats:
- `reframeCount` -- total count from `thought_reframes`
- `reframeThisMonth` -- count this month
- `reframeStreak` -- consecutive days with reframes

### 5. Dashboard UI: Update `MoodTrackerPage.tsx`

Add a new **"Reframe Activity"** card in the two-column section:
- Shows total reframes, this month count, and streak
- Small bar or sparkline showing weekly reframe frequency
- Link to the Thought Reframer page

### 6. Localization Updates

New keys in `en.json` and `ar.json` under `mentalToolkit.thoughtReframer`:
- `statsTotal`, `statsMonth`, `statsStreak`
- `stepIdentify`, `stepChallenge`, `stepReframe`
- `transformationArrow`, `deleteConfirm`, `deleteSuccess`
- `viewMore`, `noReframesYet`, `noReframesDesc`, `startReframing`
- `journalTitle`, `expandDetails`, `challengeAnswers`

New keys under `mentalToolkit.moodDashboard`:
- `reframeActivity`, `totalReframes`, `reframesThisMonth`, `reframeStreak`, `goToReframer`

---

## Files Summary

| Action | File |
|---|---|
| Migration | New `thought_reframes` table with RLS policies |
| New | `src/hooks/useThoughtReframes.ts` -- DB CRUD + stats |
| Rewrite | `src/pages/mental-toolkit/ThoughtReframerPage.tsx` -- full redesign with wizard + journal |
| Modify | `src/hooks/usePersonalMoodDashboard.ts` -- add reframe stats query |
| Modify | `src/pages/mental-toolkit/MoodTrackerPage.tsx` -- add Reframe Activity card |
| Modify | `src/locales/en.json` -- new translation keys |
| Modify | `src/locales/ar.json` -- new translation keys |
| Keep | `src/components/mental-toolkit/tools/ThoughtReframerTool.tsx` -- unchanged (used elsewhere) |

---

## Design System

- Lavender (#C9B8E8) for original thoughts, Sage Green (#A8C5A0) for reframed thoughts
- Deep Plum (#4A3F6B) for text accents
- Rounded cards (rounded-2xl), soft shadows
- Step circles with gradient fills and connecting lines
- All spacing uses logical properties (ms-/me-/ps-/pe-)
- RTL-aware arrows and flow indicators
- Smooth fade-in/slide-up transitions between steps

