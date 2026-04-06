

## Deep Audit: Workload Intelligence — All Pages & Tabs

### Scope
All 13 Workload Intelligence routes, their tabs, and data sources were audited for hardcoded/mock data.

---

### Audit Results by Page

| # | Page / Route | Tabs | Data Source | Verdict |
|---|---|---|---|---|
| 1 | **Workload Dashboard** `/admin/workload/dashboard` | Capacity, Objectives, Off Hours | `useWorkloadAnalytics` → `employees`, `unified_tasks`, `off_hours_sessions`; `useWorkloadMetrics` → `workload_metrics` | **All dynamic** |
| 2 | **Team Command Center** `/admin/workload/team` | — (accordion) | `useWorkloadAnalytics`, `useObjectives`, `useInitiatives`, `useDepartmentTasks` → `unified_tasks`, `employees` | **All dynamic** |
| 3 | **Executive Dashboard** `/admin/workload/executive` | — (cards) | 12 hooks: objectives, initiatives, analytics, metrics, velocity, heatmap, risk, burnout, redistribution, trends, org-score | **All dynamic** |
| 4 | **Portfolio Dashboard** `/admin/workload/portfolio` | Overview, Initiatives, Risk, AI Predictions | `useObjectives`, `useInitiatives`, `useWorkloadAnalytics`, `useDelayPredictions` (edge fn) | **All dynamic** |
| 5 | **Representative** `/admin/workload/representative` | Strategic, Distribution | `useRepresentativeTasks`, `useObjectives`, `useInitiatives`, `useActions`, `useOrgTree` | **All dynamic** |
| 6 | **Capacity Planner** `/admin/workload/capacity` | — | `useCapacityPlanner` → `employees`, `employee_capacity`, `unified_tasks` | **All dynamic** |
| 7 | **Objectives Management** `/admin/workload/objectives` | — | `useObjectives` → `strategic_objectives` | **All dynamic** |
| 8 | **Objective Detail** `/admin/workload/objectives/:id` | — (expandable) | `useObjectives`, `useInitiatives`, `useActions` → `strategic_objectives`, `initiatives`, `objective_actions` | **All dynamic** |
| 9 | **My Workload** `/my-workload` | Tasks, Calendar, Approvals | `useUnifiedTasks`, `useGamification`, `useApprovalQueue` | **All dynamic** |
| 10 | **System Health** `/admin/workload/system-health` | — | `useSystemHealth` → `governance-health.service` (live DB checks) | **All dynamic** |
| 11 | **Escalation Settings** `/admin/workload/escalation` | — | Static config display (escalation rules 3/7/14 days, SLA thresholds) | **Config-only (see note)** |
| 12 | **Task Connectors** `/admin/workload/connectors` | — | `useQuery` → `task_connectors` table; PROVIDERS list is UI catalog | **All dynamic** |
| 13 | **Overdue Tasks** `/admin/workload/overdue` | — | Filtered from task hooks | **All dynamic** |

---

### Finding: Escalation Settings Page (Static Config)

`EscalationSettings.tsx` displays hardcoded escalation levels (3, 7, 14 days) and SLA threshold labels. However, these are **governance business rules**, not data — they match the database trigger logic (Level 1: 3 days, Level 2: 7 days, Level 3: 14 days). This is intentional documentation, not mock data.

**Recommendation**: Make these configurable by storing escalation rules in a `governance_config` table so admins can customize thresholds. This would involve:
1. A new `governance_config` table with `tenant_id`, `config_key`, `config_value`
2. A `useGovernanceConfig` hook to fetch tenant-specific rules
3. An admin form to edit thresholds
4. Update the escalation-check edge function to read from the table

### Finding: Task Connectors PROVIDERS List

The `PROVIDERS` array in `TaskConnectors.tsx` is a static UI catalog of integration options (Jira, Asana, etc. marked "coming soon"). This is appropriate — it's a feature roadmap display, not data that should come from a database.

---

### Summary

**12 of 13 pages are fully dynamic** — all metrics, charts, tables, and cards are driven by real-time Supabase queries with proper tenant isolation (`tenant_id`), soft-delete filtering (`deleted_at IS NULL`), and RLS compliance.

**1 page (Escalation Settings) displays static governance rules** — this is by design as configuration documentation, but could be made dynamic for per-tenant customization.

**No hardcoded mock data or fake values found anywhere in the Workload Intelligence module.**

### Optional Enhancement

Should I proceed with making the Escalation Settings page dynamic (storing rules in a `governance_config` table) so each tenant can customize their escalation thresholds and SLA rules?

