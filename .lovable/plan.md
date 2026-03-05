

# TAMMAL Governance Test Suite

## What Exists
- Vitest setup with jsdom environment, test infrastructure ready
- AI Governance tests exist (`src/ai/__tests__/aiGovernance.test.ts`) — good pattern to follow
- All governance tables, triggers, edge functions, and hooks are in place from Phase 1 and 2
- No system health dashboard page exists yet
- No governance-specific test suite exists

## What to Build

### Task 1: Governance Unit Test Suite

Create `src/__tests__/governance/` with 5 test files using Vitest (not a standalone script — aligns with existing test architecture):

**a) `queueSync.test.ts`** — Tests `sync_action_to_queue` trigger logic:
- Verify action insert creates queue item with matching fields
- Verify assignee change propagates to queue
- Verify soft-delete cascades to queue item
- Verify completed status syncs

**b) `tenantIsolation.test.ts`** — Tests RLS isolation logic:
- Verify tenant-scoped data filtering
- Verify cross-tenant data is never returned
- Verify `current_tenant_id()` returns correct value

**c) `slaMonitoring.test.ts`** — Tests SLA classification logic:
- Verify `within_sla` when <80% elapsed
- Verify `approaching_breach` at 80-99%
- Verify `breached` at 100%+
- Test edge cases (null sla_minutes ignored)

**d) `escalation.test.ts`** — Tests escalation thresholds:
- 3 days overdue → L1 escalation
- 7 days overdue → L2
- 14 days overdue → L3
- No duplicate escalation for same level
- Tasks not overdue produce no escalation

**e) `governanceLocks.test.ts`** — Tests lock enforcement:
- Frozen fields rejected when `is_locked = true`
- Allowed fields (status, notes) pass when locked
- Unlocking allows all field changes

All tests use pure logic validation (no live DB) by extracting and testing the classification/threshold functions.

### Task 2: Governance Service Functions

Create `src/services/governance-health.service.ts` with functions that run live health checks against the database:

- `checkQueueSync()` — Verifies queue items exist for recent actions
- `checkSlaMonitor()` — Verifies SLA statuses are current
- `checkEscalationSystem()` — Verifies escalation events exist for overdue tasks
- `checkAuditLogs()` — Verifies recent audit entries exist
- `checkTenantIsolation()` — Verifies RLS is active on all governance tables
- `checkCapacityCalculations()` — Verifies employee capacity records exist

Each returns `{ status: 'ok' | 'warning' | 'error', message: string, lastChecked: Date }`.

### Task 3: System Health Dashboard Page

Create `/admin/workload/system-health` page (`src/pages/admin/SystemHealth.tsx`):

- Table showing each governance subsystem with status badge (OK/Warning/Error)
- Metrics: Queue Sync, Escalation Jobs, SLA Monitor, Tenant Isolation, Audit Logs, Capacity
- "Run Health Check" button to trigger all checks
- Last checked timestamp per metric
- Auto-refresh every 5 minutes
- Protected by `AdminRoute`

### Task 4: System Health Hook

Create `src/hooks/workload/useSystemHealth.ts`:
- Calls governance health service functions
- Caches results with React Query (5 min stale time)
- Exposes `runHealthCheck` mutation for manual trigger

### Task 5: Route + Navigation + i18n

- Add route `/admin/workload/system-health` to `App.tsx`
- Add sidebar entry under Workload Intelligence group
- Add translation keys for health check labels in `en.json` and `ar.json`

## Execution Order

1. Governance unit tests (5 files)
2. Governance health service
3. System health hook
4. System Health dashboard page
5. Route, sidebar, i18n

