

# Comprehensive Workload Intelligence Audit — Plan

## Audit Findings

After thorough inspection of all workload module files (14 hooks, 2 services, 2 edge functions, 5 governance components, 5 dashboard pages), here are the identified issues organized by severity.

---

### CRITICAL — Security & Data Integrity

**1. Missing `tenant_id` filter in queries (data leakage risk)**
- `useWorkloadAnalytics.ts` — `unified_tasks` query (line 48-51) has NO `tenant_id` filter. RLS provides a safety net, but defense-in-depth requires explicit filtering.
- `useWorkloadAnalytics.ts` — `off_hours_sessions` query (line 55-58) has NO `tenant_id` filter. Same issue.
- `useWorkloadMetrics.ts` — `workload_metrics` query (line 31-36) has NO `tenant_id` filter.
- `useEscalationEvents.ts` — `escalation_events` query (line 23-29) has NO `tenant_id` filter.
- `useTaskDependencies.ts` — `task_dependencies` query (line 27-34) has NO `tenant_id` filter.
- `useEmployeeCapacity.ts` — `employee_capacity` query (line 34-41) has NO `tenant_id` filter.

> **Fix**: Add `.eq('tenant_id', tenantId!)` to all six queries for defense-in-depth consistency with platform standards.

**2. Edge function `escalation-check` has NO authentication**
- The function uses the service role key directly (correct for a cron/scheduled job), but it's configured with `verify_jwt = false` AND has no auth check in code — meaning anyone with the URL can trigger it. It should either verify JWT or check for a shared secret/admin role.

**3. Edge function `workload-intelligence` — tenant_id passed from client**
- `predict_delays` and `suggest_redistribution` accept `tenant_id` from the request body. A malicious user could pass another tenant's ID. The function verifies the user via auth but does NOT validate that the authenticated user belongs to the requested tenant.

> **Fix**: Resolve `tenant_id` server-side from the authenticated user's profile instead of trusting client input.

**4. `workload-intelligence.service.ts` — client-side service bypasses RLS intent**
- `calculateUtilization`, `detectBurnoutRisk`, `computeAlignmentScore` run queries via the client SDK using the anon key. They query `objective_actions` filtered by `assignee_id` but not `tenant_id`. RLS protects, but explicit tenant filtering is missing and the service layer should enforce it.

---

### HIGH — Backend/Frontend Integration Gaps

**5. `JustificationDialog` — justification not persisted**
- The `onConfirm` callback receives the justification string but `ObjectiveDetail.tsx` (lines 302-309) discards it — it calls `deleteInitiative(id)` or `deleteAction(id)` without passing the justification anywhere. The audit trail is broken.

> **Fix**: Pass justification to the delete mutation or log it via `useAuditLog`.

**6. `EvidencePanel` — UI-only component, no backend wiring**
- `EvidencePanel.tsx` accepts `evidence` as props and an `onUpload` callback, but it is never used anywhere in the codebase. No page or dialog renders it. The evidence/compliance layer is completely disconnected.

**7. `workload-prediction.service.ts` — all stubs return null/empty**
- `predictDelays`, `suggestRedistribution`, `forecastCompletion` are all stubs. The actual prediction logic exists in the edge function but this client service is dead code — no consumer uses it.

> **Fix**: Remove the stub service file. The hooks (`useDelayPredictions`, etc.) already call the edge function directly.

**8. `useWorkloadMetrics` — `recomputeMetrics` runs heavy queries client-side**
- Recompute calls 3 separate DB queries per employee from the browser. For a team of 50+, this creates N+1 query storms. Should be moved to an edge function.

---

### MEDIUM — Code Quality & Standards

**9. File size compliance** — All files are well within limits (largest is `ObjectiveDetail.tsx` at 334 lines). No oversized files found.

**10. Missing `tenant_id` in `useActions` query**
- `useActions.ts` (line 68-74) queries `objective_actions` without `tenant_id` filter. It only filters by `initiative_id`. RLS covers it, but explicit filter is missing.

**11. RTL violations** — None found. All components use `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, and `rtl:-scale-x-100` correctly.

**12. `employees.department` vs `employees.department_id`**
- `useWorkloadAnalytics.ts` selects `department` (a string field) from `employees`, while the Executive Dashboard builds department groupings from this. Should verify this field exists and is populated, or use `department_id` with a join.

**13. `ObjectiveDetail.tsx` — `handleInitSubmit` / `handleActionSubmit` use `as any`**
- Lines 88 and 94 use untyped `data: any` parameters, violating type safety standards.

---

### LOW — Polish & Consistency

**14. `EscalationSettings.tsx` — display-only, no CRUD**
- Thresholds are hardcoded constants. No ability to configure them via the database. Acceptable as Phase 1 but should be noted.

**15. Unused imports** — `useCallback` imported in `useWorkloadMetrics.ts` but pattern is fine.

**16. `usePriorityScore` — hardcoded defaults**
- `strategicImportance` and `riskSeverity` are hardcoded to `5` in `sortByPriority`. Should ideally pull from action metadata.

---

## Implementation Plan

### Task 1: Harden all queries with explicit `tenant_id` filters
Add `.eq('tenant_id', tenantId!)` to queries in:
- `useWorkloadAnalytics.ts` (unified_tasks + off_hours_sessions)
- `useWorkloadMetrics.ts`
- `useEscalationEvents.ts`
- `useTaskDependencies.ts`
- `useEmployeeCapacity.ts`
- `useActions.ts`

### Task 2: Fix edge function security
- **`escalation-check`**: Add a shared secret or service-key-only auth check to prevent unauthorized invocation.
- **`workload-intelligence`**: Resolve `tenant_id` server-side from the authenticated user's profile instead of accepting it from the client body.

### Task 3: Wire justification to audit log
- Update `ObjectiveDetail.tsx` delete handlers to pass the justification string to `useAuditLog.logEvent()` as part of the `changes` payload.

### Task 4: Remove dead code & fix type safety
- Delete `src/services/workload-prediction.service.ts` (dead stub file — edge function handles this).
- Type the `handleInitSubmit` / `handleActionSubmit` parameters in `ObjectiveDetail.tsx` instead of `any`.

### Task 5: Verify UI display correctness
- Ensure `employees.department` field returns valid data for the Executive Dashboard department grouping.
- Confirm all i18n keys used across dashboards have entries in both `en.json` and `ar.json`.

