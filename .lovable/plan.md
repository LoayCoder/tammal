

## Full QA, UAT, Security & Production Validation Report — Wellness Copilot

### Critical Blocker Found

**Both `wellness-copilot` and `team-pulse-engine` edge functions return 401 Unauthorized in production.**

Root cause: These two functions are **missing from `supabase/config.toml`**, so they default to `verify_jwt = true`. The project uses ES256 signing-keys (JWT `alg: ES256`, `kid: 76be1fb4...`), which the Supabase gateway cannot verify when `verify_jwt = true` — the request is rejected before function code executes. Every other working edge function has `verify_jwt = false` in config.toml and handles auth in-code.

Additionally, both functions import `@supabase/supabase-js@2.89.0` while all working functions use `@2.49.1` or `@2` — the pinned 2.89.0 may have compatibility issues with the signing-keys auth flow.

---

### A. Functional Results

| Test | Status | Finding |
|------|--------|---------|
| Employee Personal Mode | **BLOCKED** | 401 — function never executes |
| Manager Personal Mode | **BLOCKED** | Same 401 |
| Manager Team Mode | **BLOCKED** | Same 401 |
| Admin Personal Mode | **BLOCKED** | Same 401 |
| Admin Team Mode | **BLOCKED** | Same 401 |
| Admin Organization Mode | **BLOCKED** | Same 401 |
| Mode Switcher UI | PASS | Frontend logic correct — `useCopilotModes` properly gates modes by role and direct reports |
| Skeleton/Loading State | PASS with warning | Console warning: `CopilotSkeleton` passes refs to `Skeleton` which is a function component without `forwardRef` |
| Empty State | PASS | `CopilotEmptyState` renders correctly with appropriate CTA routing |
| Error Fallback | PASS | Card returns `null` on error — silent but safe |
| OrgDashboard Integration | PASS | Card renders wrapped in `ErrorBoundary` |
| EmployeeHome Integration | PASS | Card renders gated on `employee` |

### B. Permission & Privacy Results

| Check | Status | Finding |
|-------|--------|---------|
| Backend mode authorization | PASS (code review) | Lines 91-101 of `wellness-copilot/index.ts` correctly reject unauthorized mode access with 403 |
| Team scope = direct reports only | PASS | Line 209-215 filters by `manager_id = emp.id` AND `tenant_id` |
| Org scope = tenant only | PASS | All org queries filter by `tenant_id = emp.tenant_id` |
| No cross-tenant leakage | PASS | Service role queries always include `.eq("tenant_id", emp.tenant_id)` |
| No personal identifiers in team/org AI output | PASS | System prompt line 349: "NEVER identify or reference individual employees by name" |
| Employee cannot access team/org via frontend | PASS | `useCopilotModes` hides modes; backend enforces with 403 |
| Frontend mode stored in localStorage | LOW RISK | Tampering localStorage only changes frontend display; backend re-validates mode |
| Cache isolation | PASS | `copilot_insight_cache` has RLS via `current_tenant_id()` and service role uses explicit `tenant_id` |

### C. AI Quality Results (Code Review)

| Check | Status | Finding |
|-------|--------|---------|
| System prompt safety | PASS | Rules prohibit clinical/medical language, fear-based wording, individual identification |
| Structured output (tool calling) | PASS | Uses function calling with strict schema — prevents freeform hallucination |
| Data grounding | PASS | Only scoped data is sent to AI; `basisStatement` field required |
| Insufficient data fallback | PASS | Threshold: personal needs 2+ mood entries or active tasks; team/org needs any mood or overdue data |
| AI failure graceful degradation | PASS | Returns `insufficientData: true` on 429, 402, parse errors, and gateway failures |
| Prompt injection risk | LOW | User-controlled data (mood notes) stripped — only `level` and `date` sent for personal mode |
| Rate limit / 402 handling | PASS | Explicit handling for 429 and 402 status codes |

### D. UI/UX Results

| Check | Status | Finding |
|-------|--------|---------|
| RTL compliance | PASS | `ChevronRight` uses `rtl:rotate-180`; no `ml-`/`mr-` used; logical `ms-`/`me-` not needed (gap-based layout) |
| Design tokens | PASS | Uses `cardVariants.premiumVip`, `text-2xs`, `text-muted-foreground` from theme |
| No hardcoded colors | PASS | All colors use CSS variables (`text-primary`, `bg-chart-1/[0.06]`, etc.) |
| Mobile layout (384px viewport) | PASS | Cards use `flex-1 min-w-0` with truncation; mode switcher uses equal-width buttons |
| Loading skeleton | PASS with warning | Ref warning in console (cosmetic) |
| Empty state CTA | PASS | Routes to correct destinations; text is bilingual |
| Urgency badge styling | PASS | Four distinct urgency styles with semantic colors |
| Typography | PASS | Uses `text-sm`, `text-xs`, `text-2xs`, `text-[10px]` consistently |

### E. Bugs / Risks

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | `wellness-copilot` missing from `config.toml` → 401 at gateway | Add `[functions.wellness-copilot]` with `verify_jwt = false` |
| 2 | **CRITICAL** | `team-pulse-engine` missing from `config.toml` → 401 at gateway | Add `[functions.team-pulse-engine]` with `verify_jwt = false` |
| 3 | **HIGH** | Both functions pin `@supabase/supabase-js@2.89.0` while working functions use `@2.49.1` | Align to `@2.49.1` for consistency and proven compatibility |
| 4 | **MEDIUM** | `CopilotSkeleton` triggers React ref warning | Wrap `Skeleton` with `forwardRef` or remove ref expectation |
| 5 | **MEDIUM** | `WellnessCopilotCard` returns `null` on error silently — no user feedback | Show a minimal retry state instead of vanishing |
| 6 | **LOW** | Org mode `uniqueParticipants` counts unique dates, not unique employees (line 283) | Should count unique employee_ids for participation rate |
| 7 | **LOW** | Cache key for team mode uses `team:${emp.id}` — if team composition changes mid-day, stale insight shown | Acceptable for daily cache, document as known behavior |
| 8 | **LOW** | `employee_capacity` query uses `.eq("user_id", emp.id)` but `emp.id` is an employee ID, not user ID | Verify column semantics — may cause null workload data |

### F. Production Readiness Decision

**NOT READY** — Two critical blockers prevent the feature from functioning at all.

### Required Fixes (Implementation Plan)

**1. Add both functions to `supabase/config.toml`**

```toml
[functions.wellness-copilot]
verify_jwt = false

[functions.team-pulse-engine]
verify_jwt = false
```

**2. Align SDK version in both edge functions**

In `supabase/functions/wellness-copilot/index.ts` and `supabase/functions/team-pulse-engine/index.ts`, change:
```
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
```
to:
```
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
```

**3. Fix `CopilotSkeleton` ref warning**

Remove `animate-pulse` from the wrapper div (Skeleton already has it) or ensure Skeleton doesn't receive refs.

**4. Fix org-mode participation metric** (line 283 of wellness-copilot)

Change from counting unique dates to counting unique employee_ids — requires adding `employee_id` to the org mood select.

**5. Fix `employee_capacity` user_id column** (line 175 of wellness-copilot)

Verify the column is `user_id` (auth user) vs `employee_id` and correct accordingly.

### Files to Change

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add 2 function entries |
| `supabase/functions/wellness-copilot/index.ts` | SDK version + org participation fix + capacity query fix |
| `supabase/functions/team-pulse-engine/index.ts` | SDK version alignment |
| `src/features/wellness-copilot/components/CopilotSkeleton.tsx` | Remove duplicate animate-pulse |

### Hardening Checklist

- [x] No unauthorized data exposure (code review passed)
- [ ] No broken states (401 blocks all states)
- [x] No dead buttons (CTA routes verified)
- [ ] No silent failures (card vanishes on error)
- [x] No inconsistent colors (design tokens used)
- [x] No layout overlap (flex layout verified)
- [ ] No loading loop (401 triggers retry:1 then stops)
- [x] No fake AI claims (structured output + data grounding)
- [x] No unstable mobile behavior (responsive layout verified)

