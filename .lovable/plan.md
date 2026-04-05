

## Wellness Copilot — End-to-End Implementation Plan

A premium, AI-powered personal intelligence module placed on the employee dashboard. Role-aware with mode switching for managers (Personal | Team) and admins (Personal | Team | Organization).

---

### Architecture Overview

```text
┌─────────────────────────────────────────────────┐
│  WellnessCopilotCard (UI Component)             │
│  ├─ CopilotModeSwitcher (segmented control)     │
│  ├─ CopilotInsightBlock (primary insight)       │
│  ├─ CopilotActionBlock (recommended action)     │
│  ├─ CopilotReasoningBlock (why + basis)         │
│  └─ CopilotStateBadge (urgency chip)            │
│                                                 │
│  useCopilotInsight(mode) ──► Edge Function       │
│       ↕                      ↕                  │
│  Role detection          Data aggregation       │
│  (useHasRole)            + AI generation        │
│                          + tool-calling schema  │
│                          + caching per scope    │
└─────────────────────────────────────────────────┘
```

---

### Phase 1: Backend — Edge Function

**File**: `supabase/functions/wellness-copilot/index.ts`

Single edge function that receives `{ mode, language }` and:

1. **Authenticates** user via JWT, resolves `employee_id`, `tenant_id`, roles
2. **Authorizes** mode access:
   - `personal` — any authenticated user
   - `team` — user must have `manager` or `tenant_admin` or `super_admin` role, OR have direct reports (`employees.manager_id`)
   - `organization` — user must have `tenant_admin` or `super_admin` role
3. **Aggregates scoped data** server-side (service role):
   - **Personal**: mood entries (14d), streak, overdue tasks, workload hours, survey responses, prayer data — all filtered by `employee_id`
   - **Team**: aggregated mood distribution, participation rate, overdue task count, workload pressure, risk indicators — filtered by `manager_id = employee.id`
   - **Organization**: org-wide wellness score, department participation, workload-risk patterns, response gaps — filtered by `tenant_id`
4. **Checks cache**: `copilot_insight_cache` table keyed by `(scope_key, insight_date)` where `scope_key` = `personal:{employee_id}` | `team:{employee_id}` | `org:{tenant_id}`
5. **Calls Lovable AI** with tool-calling schema (structured output) using `google/gemini-3-flash-preview`:
   - Tool schema enforces: `primaryInsight`, `recommendedAction`, `reasoning`, `basisStatement`, `urgencyLevel` (opportunity | neutral | attention | urgent), `secondaryInsight?`, `actionCta`
   - System prompt enforces: no clinical language, no fear-based wording, premium tone, grounded in scoped data only
6. **Caches result**, returns structured JSON
7. **Fallback**: If insufficient data, returns `{ insufficientData: true, fallbackCta: "complete_checkin" | "review_workload" | "launch_survey" }`
8. **Error handling**: 429/402 surfaced, auth errors returned, AI failures return graceful degradation

---

### Phase 2: Database Migration

**New table**: `copilot_insight_cache`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| scope_key | text NOT NULL | `personal:{id}`, `team:{id}`, `org:{tenant_id}` |
| tenant_id | uuid NOT NULL FK | RLS isolation |
| insight_date | date NOT NULL | |
| insight_data | jsonb NOT NULL | AI output |
| created_at | timestamptz | |

- Unique constraint on `(scope_key, insight_date)`
- RLS: authenticated users with matching `tenant_id` via `current_tenant_id()`

---

### Phase 3: Frontend Hook

**File**: `src/features/wellness-copilot/hooks/useCopilotInsight.ts`

- Accepts `mode: 'personal' | 'team' | 'organization'`
- Calls edge function via `supabase.functions.invoke('wellness-copilot', { body: { mode, language } })`
- React Query with key `['copilot-insight', mode, employeeId]`, `staleTime: 30min`
- Returns `{ insight, isPending, error, isInsufficientData, refetch }`

**File**: `src/features/wellness-copilot/hooks/useCopilotModes.ts`

- Uses `useHasRole` + direct reports check to determine allowed modes
- Returns `{ allowedModes: CopilotMode[], defaultMode }`
- Persists last selected mode in `localStorage` per user

---

### Phase 4: Frontend Components

**Directory**: `src/features/wellness-copilot/components/`

| Component | Purpose |
|-----------|---------|
| `WellnessCopilotCard.tsx` | Main premium card, orchestrates mode + data |
| `CopilotModeSwitcher.tsx` | Segmented control (Personal \| Team \| Organization) |
| `CopilotInsightBlock.tsx` | Primary insight with icon + urgency badge |
| `CopilotActionBlock.tsx` | Recommended action with CTA button |
| `CopilotReasoningBlock.tsx` | "Why this matters" + "Based on" labels |
| `CopilotEmptyState.tsx` | Insufficient data with helpful CTA |
| `CopilotSkeleton.tsx` | Premium shimmer loading state |

**Design tokens used**: `cardVariants.premiumVip`, `typography.cardTitle`, `premium-card` surface, `rounded-2xl`, semantic HSL colors. Sparkles icon for header. Soft glassmorphism. No heavy borders. Clean spacing with `space-y-4`. Mode switcher uses `bg-muted/10` segments with `bg-primary/10` active state.

---

### Phase 5: Dashboard Integration

**File**: `src/pages/EmployeeHome.tsx`

- Add `<WellnessCopilotCard />` after the Engagement Rank Badge, before Support Hub
- Only renders when employee is loaded

---

### Phase 6: Localization

**Files**: `src/locales/en.json`, `src/locales/ar.json`

New namespace `copilot.*` with ~20 keys: title, modes, insight labels, CTA labels, empty states, error messages.

---

### Privacy & Security

- All data aggregation happens server-side in the edge function using service role
- Mode authorization enforced server-side — frontend only hides unavailable modes
- Team mode uses `employees.manager_id` to scope direct reports
- Organization mode checks `tenant_admin` or `super_admin` role
- No individual employee data exposed in team/org modes — only aggregates
- Cache is tenant-isolated via RLS
- AI prompt explicitly instructs: no medical diagnosis, no individual identification in team/org outputs

---

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/wellness-copilot/index.ts` | **New** — edge function |
| Migration | **New** — `copilot_insight_cache` table |
| `src/features/wellness-copilot/hooks/useCopilotInsight.ts` | **New** |
| `src/features/wellness-copilot/hooks/useCopilotModes.ts` | **New** |
| `src/features/wellness-copilot/components/WellnessCopilotCard.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotModeSwitcher.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotInsightBlock.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotActionBlock.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotReasoningBlock.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotEmptyState.tsx` | **New** |
| `src/features/wellness-copilot/components/CopilotSkeleton.tsx` | **New** |
| `src/features/wellness-copilot/index.ts` | **New** — barrel export |
| `src/pages/EmployeeHome.tsx` | Add Copilot card |
| `src/locales/en.json` | Add copilot keys |
| `src/locales/ar.json` | Add copilot keys |

