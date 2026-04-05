

## Phase 3 — Missing Foundation Features: Assessment & Plan

### Current State (Already Built)

The audit confirms these foundation features are **already implemented**:

| Feature | Status | Evidence |
|---------|--------|----------|
| Peer Appreciation System | Done | `appreciations` table, RLS, validation triggers, `useAppreciations` hook, `QuickAppreciationCard` UI, +5 points gamification |
| Engagement Score Engine | Done | `team-pulse-engine` edge function with composite scoring (check-ins 30%, surveys 20%, tasks 15%, recognition 20%, streaks 15%) |
| Role-Aware Mode Switching | Done | `usePulseModes` with personal/team/org modes, authorization enforced server-side |
| AI Insight Generation | Done | Gemini AI with structured tool-calling, daily caching in `copilot_insight_cache` |
| Action Path / CTA | Done | `PulseActionPath` component with route-based CTAs |
| Target Tracking | Done | `PulseTargetBlock` with current/target value progress display |

### What Is Still Missing (Phase 3 Scope)

These are the features from the requirement list that do **not** yet exist:

| Feature | Priority | Description |
|---------|----------|-------------|
| **Appreciation Activity Summary** | High | Managers/admins cannot view appreciation activity as an engagement signal in a summary view — only raw counts in the engine. Add a compact `AppreciationActivityWidget` showing top categories, volume trend, and top receivers (anonymized for team/org) |
| **Manager Appreciation Nudge** | High | Managers cannot trigger a team appreciation nudge. Add a one-tap "Encourage your team to recognize each other" action in Team mode |
| **Engagement Target History** | Medium | No persistence of engagement targets — each day generates a new one. Add a `pulse_targets` table to track target → actual over time |
| **Action Nudge Prompts** | Medium | When engagement score drops below threshold (< 50), show a contextual nudge card on dashboard prompting specific actions |
| **Participation Prompt Engine** | Low | Automated prompts for employees who haven't checked in for 3+ days — requires scheduled function |

### Implementation Plan

#### 1. Appreciation Activity Widget (New Component)

**File**: `src/features/team-pulse/components/AppreciationActivityWidget.tsx`

A compact card below `QuickAppreciationCard` showing:
- Total appreciations sent/received (30d)
- Top category breakdown (horizontal mini-bars)
- "Most appreciated" badge (personal mode: your top category; team/org: top category across scope)
- Uses existing `useAppreciations` data + a new `useAppreciationStats` hook

**File**: `src/features/team-pulse/hooks/useAppreciationStats.ts`

Aggregates appreciation data by category for the current scope (personal/team/org). Uses Supabase `.select()` with grouping.

#### 2. Manager Appreciation Nudge

**File**: `src/features/team-pulse/components/TeamPulseCard.tsx` (modify)

In Team mode, add a "Send Team Kudos Nudge" button that:
- Creates an appreciation from manager to team with category "teamwork" and a preset encouraging message
- Shows success toast
- Only visible when `selectedMode === "team"`

#### 3. Engagement Target Persistence

**Migration**: New `pulse_targets` table

```sql
CREATE TABLE pulse_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  scope TEXT NOT NULL, -- 'personal', 'team', 'org'
  target_metric TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  target_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

- RLS: tenant isolation
- Edge function writes a row each time it generates a new insight
- `PulseTargetBlock` reads historical targets for sparkline trend

#### 4. Low-Score Nudge Card

**File**: `src/features/team-pulse/components/PulseNudgeCard.tsx`

When `engagementScore < 50`, renders a contextual nudge:
- Score < 30: "Your engagement is low — try a quick check-in today"
- Score 30-49: "You're on track — one more action could boost your score"
- Links to the most impactful missing action (check-in if 0 checkins, appreciation if 0 sent, etc.)

Integrated into `TeamPulseCard` below the insight block.

#### 5. Localization

Add keys for all new strings in `en.json` and `ar.json` under `pulse.*`.

---

### Files Summary

| File | Change |
|------|--------|
| `src/features/team-pulse/hooks/useAppreciationStats.ts` | **New** — category aggregation hook |
| `src/features/team-pulse/components/AppreciationActivityWidget.tsx` | **New** — appreciation summary card |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | **New** — low-score contextual nudge |
| `src/features/team-pulse/components/TeamPulseCard.tsx` | **Modify** — add nudge integration + team kudos button |
| `src/features/team-pulse/index.ts` | **Modify** — export new components |
| Migration | **New** — `pulse_targets` table with RLS |
| `supabase/functions/team-pulse-engine/index.ts` | **Modify** — write to `pulse_targets` on insight generation |
| `src/pages/EmployeeHome.tsx` | **Modify** — add `AppreciationActivityWidget` |
| `src/locales/en.json` | **Modify** — add new pulse keys |
| `src/locales/ar.json` | **Modify** — add new pulse keys |

### What Is Intentionally Deferred

- **Participation Prompt Engine** (requires pg_cron scheduled function — separate phase)
- **Campaign Templates** (requires admin UI builder — future feature)
- **Follow-up Workflow** (requires notification system extension — future feature)

