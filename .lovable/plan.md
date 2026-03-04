

## Strategic Execution Platform Upgrade — Phased Implementation Plan

This is a large-scale enterprise upgrade spanning database schema changes, new services, new pages, and enhanced existing pages. Due to the scale (~19 features), the work will be split into **4 phases**, each deliverable independently.

---

### What Already Exists

| Entity | Table | Has owner_user_id | Has accountable_user_id |
|---|---|---|---|
| Strategic Objectives | `strategic_objectives` | Yes | No |
| Initiatives | `initiatives` | Yes (`owner_user_id`) | No |
| Actions | `objective_actions` | Yes (`assignee_id`) | No |
| Sub-tasks | `action_sub_tasks` | No | No |

Existing features: lock/unlock, progress auto-calculation trigger (`recalculate_initiative_progress`), off-hours sessions, unified tasks, team workload dashboard, representative system, audit logging.

Missing: `employee_capacity`, `workload_metrics`, `escalation_events`, `task_dependencies` tables. No evidence/SLA fields. No portfolio or executive dashboards.

---

### Phase 1: Data Model & Accountability (Database Migrations)

**Migration 1 — Ownership & Accountability columns:**
```sql
-- strategic_objectives: already has owner_user_id, add accountable_user_id
ALTER TABLE strategic_objectives ADD COLUMN accountable_user_id UUID REFERENCES employees(id);

-- initiatives: already has owner_user_id, add accountable_user_id
ALTER TABLE initiatives ADD COLUMN accountable_user_id UUID REFERENCES employees(id);

-- objective_actions: already has assignee_id, add accountable_user_id
ALTER TABLE objective_actions ADD COLUMN accountable_user_id UUID REFERENCES employees(id);

-- action_sub_tasks: add assigned_user_id
ALTER TABLE action_sub_tasks ADD COLUMN assigned_user_id UUID REFERENCES employees(id);
```

**Migration 2 — Employee Capacity table:**
```sql
CREATE TABLE employee_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES employees(id),
  daily_capacity_minutes INT NOT NULL DEFAULT 480,
  weekly_capacity_minutes INT NOT NULL DEFAULT 2400,
  max_concurrent_actions INT NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE employee_capacity ENABLE ROW LEVEL SECURITY;
-- RLS + updated_at trigger
```

**Migration 3 — Workload Metrics table:**
```sql
CREATE TABLE workload_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  utilization_percentage NUMERIC(5,2) DEFAULT 0,
  burnout_risk_score NUMERIC(5,2) DEFAULT 0,
  alignment_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, employee_id)
);
ALTER TABLE workload_metrics ENABLE ROW LEVEL SECURITY;
```

**Migration 4 — Evidence & SLA fields on objective_actions:**
```sql
ALTER TABLE objective_actions
  ADD COLUMN evidence_url TEXT,
  ADD COLUMN evidence_type TEXT,
  ADD COLUMN verified_by UUID REFERENCES employees(id),
  ADD COLUMN verified_at TIMESTAMPTZ,
  ADD COLUMN sla_minutes INT,
  ADD COLUMN sla_status TEXT DEFAULT 'within_sla',
  ADD COLUMN priority_score NUMERIC(5,2);
```

**Migration 5 — Task Dependencies table:**
```sql
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  task_id UUID NOT NULL REFERENCES objective_actions(id),
  depends_on_task_id UUID NOT NULL REFERENCES objective_actions(id),
  dependency_type TEXT NOT NULL DEFAULT 'depends_on',
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
```

**Migration 6 — Escalation Events table:**
```sql
CREATE TABLE escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  task_id UUID NOT NULL REFERENCES objective_actions(id),
  escalation_level INT NOT NULL DEFAULT 1,
  escalated_to UUID REFERENCES employees(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
```

All tables include tenant_id, soft-delete (`deleted_at`), RLS policies using `get_user_tenant_id(auth.uid())`, and `updated_at` triggers where applicable.

---

### Phase 2: Workload Intelligence Service & Hooks

**New service:** `src/services/workload-intelligence.service.ts`
- `calculateUtilization(employeeId)` — SUM active action estimated_hours vs capacity
- `detectBurnoutRisk(employeeId)` — checks daily_work > 480min, overdue > 3, off_hours > 120min
- `computeAlignmentScore(employeeId)` — linked actions / total actions
- `predictDelays(initiativeId)` — placeholder architecture for future AI

**New hooks:**
- `src/hooks/workload/useEmployeeCapacity.ts` — CRUD for employee_capacity
- `src/hooks/workload/useWorkloadMetrics.ts` — read/compute workload_metrics
- `src/hooks/workload/useTaskDependencies.ts` — manage task_dependencies
- `src/hooks/workload/useEscalationEvents.ts` — read escalation_events
- `src/hooks/workload/usePriorityScore.ts` — compute dynamic priority_score

**Priority Score Formula (computed client-side or via DB function):**
```
priority_score = (strategic_importance × 0.4) + (urgency × 0.3) + (risk × 0.2) + (manager_priority × 0.1)
```

---

### Phase 3: UI — Enhanced Dashboards & New Pages

**3A. Enhance `/admin/workload` (WorkloadDashboard):**
- Add utilization percentage classification badges (Underutilized / Healthy / High Load / Burnout Risk)
- Add alignment score display per employee
- Add SLA status badges on task cards

**3B. Enhance `/admin/workload/team` (TeamWorkload):**
- Show utilization percentage column in team table
- Show burnout risk indicator
- Add priority_score sorting
- Display task dependency indicators
- Show escalation alerts

**3C. Enhance `/my-workload` (Employee Dashboard):**
- Tasks due today / this week sections
- Workload utilization gauge
- Priority-ranked task list with SLA badges
- Evidence upload capability on actions

**3D. New Page `/admin/workload/portfolio` (Initiative Portfolio):**
- KPI cards: Total Objectives, Active Initiatives, At Risk, Budget Utilization
- Charts: Objective progress, Initiative completion velocity, Department execution rate
- Risk heatmap grid
- Status filtering (On Track / Delayed / At Risk)

**3E. New Page `/admin/workload/executive` (Executive Dashboard):**
- Strategic progress overview
- Initiative risk heatmap
- Workforce capacity utilization summary
- Burnout risk map
- Alignment score organization-wide

**3F. Route Registration:**
- Add `/admin/workload/portfolio` and `/admin/workload/executive` to router (AdminRoute guard)
- Add sidebar navigation items under SaaS Management > Workload group

---

### Phase 4: Governance, Escalation & Future AI

**4A. Escalation Automation:**
- Edge function `check-escalations` triggered by pg_cron daily
- Rules: 3 days overdue → notify manager, 7 days → dept head, 14 days → executive
- Inserts into `escalation_events` and creates system notifications

**4B. Evidence & Compliance:**
- File upload to `recognition-attachments` bucket (or new `workload-evidence` bucket)
- Evidence type selector (document, photo, inspection report, approval)
- Verified-by / verified-at workflow

**4C. SLA Tracking:**
- Validation trigger for sla_status transitions
- Auto-compute `sla_status` based on `sla_minutes` vs actual elapsed time
- Visual SLA badge on all task cards

**4D. Audit System:**
- Already exists via `audit_logs` table and `useAuditLog` hook
- Extend entity_type enum to cover new entities (escalation_event, task_dependency, employee_capacity)

**4E. Predictive AI Layer (Structure Only):**
- Create `src/services/workload-prediction.service.ts` with interface stubs
- Types for `DelayPrediction`, `WorkloadRedistribution`, `CompletionForecast`
- No model implementation — ready for future integration

---

### Translation Keys

Add ~60 new keys to `en.json` and `ar.json` covering:
- Portfolio dashboard labels
- Executive dashboard labels
- Capacity/utilization terminology
- Escalation terminology
- Evidence/SLA terminology
- Burnout risk labels

---

### Implementation Order

Due to the scope, I recommend implementing in this order:
1. **Phase 1** (all migrations) — foundation
2. **Phase 2** (service + hooks) — business logic
3. **Phase 3A-3C** (enhance existing pages) — immediate value
4. **Phase 3D-3E** (new pages) — executive visibility
5. **Phase 4** (escalation, evidence, AI stubs) — governance

Each phase is self-contained and testable. Total estimate: 4-5 implementation rounds.

Shall I proceed with **Phase 1 (all database migrations)** first?

