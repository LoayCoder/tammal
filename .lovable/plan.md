

## Team Pulse Action Hub — Phase 1: Full System Audit & Gap Analysis

### Current State Summary

The TAMMAL platform is a mature, multi-tenant enterprise wellness SaaS with extensive existing infrastructure across 10+ feature domains.

---

### What Already Exists (Reusable)

**Engagement Data Sources**
- `mood_entries` — daily check-ins with mood score, streak count, support actions
- `useEmployeeEngagementRank` — 30-day streak + response count ranking
- `useGamification` — streak, total points
- `useMoodHistory` — personal mood timeline
- Survey system — full lifecycle (create, schedule, deliver, monitor)
- Workload system — tasks, overdue tracking, utilization metrics, burnout risk
- Recognition system — nominations, endorsements, voting, points, redemption
- Prayer/spiritual tracker — daily routine tracking

**Analytics Engine**
- `src/lib/analytics/` — full modular analytics with queries, computations, synthesis
- `usePulseMetrics` — Check-in Pulse, Survey Structural analysis, BAI Synthesis
- `useOrgAnalytics` — org-wide KPIs (active employees, avg mood, participation, risk %, streak)
- `useAnalyticsOverview` — overview analytics
- `useRiskIndicators` — risk detection
- Early warning system — declining trends, spikes, low engagement alerts
- Period comparison — mood/participation/risk deltas over time
- Top Engagers — already computed with streak, response count, points

**Role & Access System**
- `useHasRole` — checks `super_admin`, `tenant_admin`, `manager`
- `useCopilotModes` — role-aware mode switching (personal/team/org) with direct reports check
- `has_role()` DB function — security definer for RLS
- `is_manager()`, `is_representative()` DB functions
- `employees.manager_id` — team hierarchy
- Full RLS + tenant isolation via `current_tenant_id()`

**AI Integration**
- Wellness Copilot edge function — already uses Lovable AI (Gemini), structured tool-calling, caching
- `copilot_insight_cache` table — scope-keyed daily cache
- AI governance system — Thompson Sampling, dual-provider routing

**Design System**
- `src/theme/tokens.ts` — full token system (typography, cardVariants, spacing, layout, iconBox)
- `src/components/system/` — StatCard, MetricCard, InsightCard, ChartCard, DashboardGrid, PageHeader
- Premium variants: `premiumVip`, `premium-card`, `glass-card`, `glass-stat`
- Animations: `badge-pop`, `shimmer-once`, `animate-fade-in`
- Semantic color system with HSL tokens

**Notification System**
- `task_notifications` table with types (assigned, status_changed, deadline_approaching, etc.)
- DB triggers for task changes, comment additions, checklist completion
- Toast notifications via Sonner throughout the app

---

### What Is Missing (Gaps)

| Gap | Impact | Resolution |
|-----|--------|------------|
| **No peer appreciation/kudos feature** | Cannot measure peer-to-peer engagement signals | Build lightweight appreciation system (new table + UI) |
| **No engagement score composite** | No single "engagement health" metric combining check-ins + surveys + tasks + recognition | Compute server-side in new edge function |
| **No action/nudge framework** | No way to suggest/track recommended actions for engagement | Build as part of Team Pulse Action Hub |
| **No team-level engagement dashboard** | Managers lack a focused engagement view (workload dashboard exists but is task-focused) | Build as part of this feature |
| **No engagement campaign system** | No ability to run targeted engagement campaigns | Out of scope for Phase 1, but architecture should allow it |

---

### Recommended Implementation Approach (Phases 2-5)

**Phase 2 — Peer Appreciation System (Missing Dependency)**
- New `appreciations` table: `id, tenant_id, from_employee_id, to_employee_id, message, category (teamwork|innovation|support|leadership|above_beyond), created_at, deleted_at`
- RLS: authenticated users within same tenant
- Simple send/receive UI on employee dashboard
- Points integration (award points for giving/receiving)
- This fills the "appreciation" gap and provides a new engagement signal

**Phase 3 — Engagement Score Engine (Edge Function)**
- New edge function `team-pulse-engine` that computes a composite engagement score per employee/team/org:
  - Check-in consistency (30%)
  - Survey participation (20%)
  - Task completion rate (15%)
  - Recognition activity — nominations given/received + appreciations (20%)
  - Streak health (15%)
- Returns: engagement score, trend direction, recommended action, target metric, action path
- Caches in `copilot_insight_cache` with scope `pulse:personal:{id}` / `pulse:team:{id}` / `pulse:org:{tenant_id}`
- Reuses existing data queries from `wellness-copilot` edge function patterns

**Phase 4 — Team Pulse Action Hub UI**
- New feature folder: `src/features/team-pulse/`
- `TeamPulseCard` — premium dashboard card (same pattern as WellnessCopilotCard)
  - Mode switcher: Personal | Team | Organization (reuses `CopilotModeSwitcher` pattern)
  - Engagement score gauge (circular/semi-circle)
  - Primary insight + recommended action
  - Measurable target with progress indicator
  - Action CTA button
- `PulseInsightBlock`, `PulseTargetBlock`, `PulseActionPath`
- Loading skeleton + empty state + error handling
- Placed on EmployeeHome after Wellness Copilot

**Phase 5 — Integration & Polish**
- Dashboard integration in EmployeeHome
- Localization (en + ar)
- Mobile responsiveness verification
- End-to-end testing

---

### Files Summary (All Phases)

| Phase | File | Change |
|-------|------|--------|
| 2 | Migration | New `appreciations` table |
| 2 | `src/features/team-pulse/components/QuickAppreciationCard.tsx` | New — send appreciation widget |
| 2 | `src/features/team-pulse/hooks/useAppreciations.ts` | New — CRUD hook |
| 3 | `supabase/functions/team-pulse-engine/index.ts` | New — engagement score edge function |
| 4 | `src/features/team-pulse/components/TeamPulseCard.tsx` | New — main premium card |
| 4 | `src/features/team-pulse/components/PulseInsightBlock.tsx` | New |
| 4 | `src/features/team-pulse/components/PulseTargetBlock.tsx` | New |
| 4 | `src/features/team-pulse/components/PulseActionPath.tsx` | New |
| 4 | `src/features/team-pulse/components/PulseSkeleton.tsx` | New |
| 4 | `src/features/team-pulse/hooks/useTeamPulse.ts` | New — edge function hook |
| 4 | `src/features/team-pulse/hooks/usePulseModes.ts` | New — reuses CopilotModes pattern |
| 4 | `src/features/team-pulse/index.ts` | New — barrel export |
| 5 | `src/pages/EmployeeHome.tsx` | Add TeamPulseCard |
| 5 | `src/locales/en.json` | Add pulse.* keys |
| 5 | `src/locales/ar.json` | Add pulse.* keys |

---

### Risks & Blockers

1. **Data density**: New tenants with few check-ins will hit "insufficient data" — handled via fallback states (same pattern as Wellness Copilot)
2. **AI cost**: Additional edge function calls — mitigated by daily caching
3. **Appreciation adoption**: New feature needs visibility on dashboard to drive usage
4. **Performance**: Composite score computation touches multiple tables — mitigated by server-side aggregation and caching

---

### Next Step

Approve this audit, and I will begin Phase 2 (Peer Appreciation System) as the first implementation step.

