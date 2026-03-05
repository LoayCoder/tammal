

# TAMMAL Workload Platform — Final Enterprise Hardening Plan

## Current State Summary

After inspecting the database, here is what already exists:
- **RLS enabled** on all 9 existing workload tables (objective_actions, initiatives, strategic_objectives, etc.)
- **RLS policies** already use `get_user_tenant_id(auth.uid())` — the function exists and works correctly
- **Missing tables**: `task_queue_items`, `task_evidence`, `approvals`, `notifications` do NOT exist yet
- **No governance lock trigger** — lock enforcement is UI-only
- **No action→queue sync trigger** — no `task_queue_items` table exists
- **Escalation edge function** exists but no scheduled cron job
- **SLA columns** exist on `objective_actions` (`sla_minutes`, `sla_status`) but no automated monitoring
- **pg_cron + pg_net** extensions are active
- **Audit logs** exist but missing INSERT policy for tenant users and `ip_address` column
- **Missing indexes** for production-scale queries

---

## Implementation Tasks

### Task 1: Create `current_tenant_id()` Helper Function

The user's spec references `current_tenant_id()` but it doesn't exist — `get_user_tenant_id(auth.uid())` does. Create `current_tenant_id()` as an alias for cleaner policy syntax:

```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
$$;
```

### Task 2: Create Missing Tables

Create the 3 tables that don't exist yet (notifications already exists elsewhere or will be created):

**a) `task_queue_items`** — Unified task queue synchronized from actions
- Columns: id, tenant_id, action_id (FK), employee_id, title, status, priority, due_date, source_type, created_at, updated_at, deleted_at
- RLS with tenant isolation

**b) `task_evidence`** — Evidence/compliance attachments for actions
- Columns: id, tenant_id, action_id (FK), file_url, file_type, uploaded_by, status (pending/approved/rejected), verified_by, verified_at, created_at, deleted_at
- RLS with tenant isolation

**c) `approvals`** — Governance approval records
- Columns: id, tenant_id, entity_type, entity_id, requested_by, approved_by, status (pending/approved/rejected), justification, created_at, updated_at, deleted_at
- RLS with tenant isolation

### Task 3: Add Audit Log INSERT Policy + IP Column

- Add `ip_address TEXT` column to `audit_logs`
- Add INSERT policy for authenticated tenant users so hooks can write audit entries

### Task 4: Governance Lock Trigger

Create a `BEFORE UPDATE` trigger on `objective_actions` that prevents modification of frozen fields when `is_locked = true`:

Frozen fields: `title`, `title_ar`, `description`, `assignee_id`, `priority`, `estimated_hours`, `planned_start`, `planned_end`

Allowed when locked: `status`, `comments`, `actual_hours`, `evidence_url`, `evidence_type`, `verified_by`, `verified_at`, `sla_status`

Same trigger on `initiatives` and `strategic_objectives` for their respective fields.

### Task 5: Action → Task Queue Sync Trigger

Create an `AFTER INSERT OR UPDATE OR DELETE` trigger on `objective_actions` that:
- On INSERT → creates a `task_queue_items` row
- On assignee change → updates queue owner
- On soft delete → soft-deletes queue item
- On status=completed → updates queue status

### Task 6: Schedule Escalation Cron Job

Use `pg_cron` to schedule the existing `escalation-check` edge function every hour:

```sql
SELECT cron.schedule('escalation-check-hourly', '0 * * * *', $$
  SELECT net.http_post(
    url:='https://eojxreaidrfmggglmspr.supabase.co/functions/v1/escalation-check',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <service_role_key>"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
$$);
```

### Task 7: SLA Monitoring Job

Create a new edge function `sla-monitor` that:
- Scans all `objective_actions` with `sla_minutes IS NOT NULL`
- Calculates elapsed time since `created_at`
- Updates `sla_status` to `approaching_breach` (>80%) or `breached` (>100%)
- Schedule via `pg_cron` every 30 minutes

### Task 8: Production-Scale Indexes

Add composite indexes for high-volume queries:

```sql
CREATE INDEX IF NOT EXISTS idx_actions_tenant_status ON objective_actions (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_actions_tenant_assignee ON objective_actions (tenant_id, assignee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_actions_tenant_due ON objective_actions (tenant_id, planned_end) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_unified_tasks_tenant_employee ON unified_tasks (tenant_id, employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity ON audit_logs (tenant_id, entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalation_tenant_level ON escalation_events (tenant_id, escalation_level) WHERE deleted_at IS NULL;
```

### Task 9: Strengthen RLS Policies

- Add DELETE policies (currently some tables only have SELECT/INSERT/UPDATE)
- Add INSERT policy on `audit_logs` for tenant users
- Add manager-level policies on `escalation_events` and `task_evidence`
- Ensure `soft-delete` filter (`deleted_at IS NULL`) is in all SELECT policies that lack it

### Task 10: Update Edge Function + Frontend

- Create `sla-monitor` edge function
- Register in `supabase/config.toml`
- Update `useWorkloadIntelligence.ts` to expose SLA monitoring trigger for manual runs

---

## Execution Order

1. Migration: `current_tenant_id()` function
2. Migration: Create `task_queue_items`, `task_evidence`, `approvals` tables with RLS
3. Migration: Audit log enhancements (ip_address column, INSERT policy)
4. Migration: Governance lock triggers (objective_actions, initiatives, strategic_objectives)
5. Migration: Action→queue sync trigger
6. Migration: Production indexes
7. Migration: Strengthen RLS policies
8. Edge function: `sla-monitor`
9. Cron jobs: escalation-check + sla-monitor schedules (via insert tool)
10. Frontend: Hook updates for new tables

