

## Phase 4 — Data Model, Backend Logic, and Permissions: Assessment & Plan

### Current Backend State (Already Built)

The audit confirms the following backend layers are **fully implemented**:

| Layer | Status | Details |
|-------|--------|---------|
| `appreciations` table | Done | Full CRUD, RLS (tenant isolation), validation triggers (category, no self-send), soft-delete, indexes |
| `pulse_targets` table | Done | Scope validation trigger, RLS, tenant isolation, employee reference, date-based indexing |
| `copilot_insight_cache` table | Done | Scope-key + date uniqueness, RLS, tenant isolation |
| `team-pulse-engine` Edge Function | Done | 504 lines — auth, role resolution, 3-mode data aggregation, composite scoring, AI generation, caching, target persistence |
| Authorization (server-side) | Done | JWT auth → user_roles check → mode gating (team requires manager/direct reports, org requires admin) |
| Tenant isolation (server-side) | Done | Service role client uses explicit `.eq("tenant_id", emp.tenant_id)` on every query — defense-in-depth |
| RLS on all tables | Done | `current_tenant_id()` enforced on appreciations, pulse_targets, copilot_insight_cache |
| Role resolution | Done | `user_roles` lookup for super_admin/tenant_admin/manager with Set-based checking |
| Team hierarchy | Done | `employees.manager_id` used for direct-reports scoping in team mode |
| Privacy guards | Done | Team/org modes aggregate only — no individual employee identification in AI prompts or responses |
| Data scoping | Done | Personal: own data only. Team: direct reports via `manager_id`. Org: full tenant via `tenant_id` |
| Points integration | Done | +5 points on appreciation send via `points_transactions` insert |

### What Is Missing (Gaps to Address)

| Gap | Priority | Description |
|-----|----------|-------------|
| **Engagement Action Log** | High | No table to track when users take actions prompted by pulse insights (e.g., "user clicked CTA", "user completed nudge"). This is needed for KPI measurement and to close the feedback loop. |
| **Appreciation tenant_id defense-in-depth** | Medium | Frontend `useAppreciationStats` uses RLS for team/org filtering but lacks explicit `.eq("tenant_id", tenantId)` defense-in-depth filter — relies solely on RLS |
| **pulse_targets unique constraint** | Low | No unique constraint on (employee_id, scope, target_date) — duplicate rows possible if edge function retries |

### Implementation Plan

#### 1. Engagement Action Log Table (New Migration)

Track when users interact with pulse insights and nudges. This enables KPI measurement for "Action completion rate".

```sql
CREATE TABLE public.engagement_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  action_type TEXT NOT NULL, -- 'cta_clicked', 'nudge_dismissed', 'nudge_acted', 'appreciation_sent', 'checkin_from_nudge'
  source TEXT NOT NULL, -- 'pulse_card', 'nudge_card', 'appreciation_widget'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

- RLS: tenant isolation via `current_tenant_id()`
- Indexes: tenant_id, employee_id, action_type, created_at
- Validation trigger for `action_type`

#### 2. pulse_targets Unique Constraint (Migration)

Prevent duplicate daily targets:
```sql
CREATE UNIQUE INDEX idx_pulse_targets_unique_daily 
ON public.pulse_targets(employee_id, scope, target_date) 
WHERE deleted_at IS NULL;
```

With `COALESCE(employee_id, '00000000-...')` handling for org-scope null employee_id.

#### 3. Harden Frontend Hooks — Defense-in-Depth

**`useAppreciationStats.ts`**: Add explicit `.eq("tenant_id", tenantId)` to the team/org query path (line 62-67 already has it, but verify personal mode also filters).

#### 4. Frontend Action Logging Hook

**New file**: `src/features/team-pulse/hooks/useEngagementActionLog.ts`

A mutation hook that writes to `engagement_action_log` when users click CTAs, dismiss nudges, or complete prompted actions. Consumed by `PulseActionPath`, `PulseNudgeCard`, and `QuickAppreciationCard`.

#### 5. Edge Function — Upsert Fix for pulse_targets

Update the `team-pulse-engine` to use upsert with the new unique constraint instead of plain insert, preventing duplicate row errors on retries.

---

### Files Summary

| File | Change |
|------|--------|
| Migration (new) | `engagement_action_log` table + RLS + indexes + validation trigger |
| Migration (new) | `pulse_targets` unique constraint |
| `src/features/team-pulse/hooks/useEngagementActionLog.ts` | **New** — mutation hook for action tracking |
| `src/features/team-pulse/hooks/useAppreciationStats.ts` | **Modify** — add defense-in-depth tenant filter to personal mode |
| `src/features/team-pulse/components/PulseActionPath.tsx` | **Modify** — log CTA clicks |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | **Modify** — log nudge interactions |
| `supabase/functions/team-pulse-engine/index.ts` | **Modify** — upsert pulse_targets instead of insert |

### Security Validation

- All new tables use RLS with `current_tenant_id()`
- No client-side access control — all mode authorization enforced server-side in edge function
- Defense-in-depth explicit tenant filters on all frontend queries
- Soft-delete standard maintained on all new tables
- No cross-tenant data leakage possible — verified in edge function query patterns

