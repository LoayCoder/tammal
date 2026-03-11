

# Codebase Architecture Audit Report

## Overall Assessment

The project is **well-structured for its scale** (~300+ files). Feature isolation, lazy loading, centralized tokens, and shared UI patterns are solid foundations. However, organic growth has introduced inconsistencies that should be addressed. Below are findings ranked by priority.

---

## CRITICAL — Fix These First

### 1. Duplicate tenant ID resolution (3 competing patterns)

There are **three different ways** to get the current user's tenant ID:

| Pattern | Location | Method |
|---|---|---|
| `useTenantId()` | `src/hooks/org/useTenantId.ts` | Queries `profiles` table |
| `useTenantIdQuery()` | `src/hooks/admin/useTenantIdQuery.ts` | Calls `get_user_tenant_id` RPC |
| Inline RPC call | `QuestionManagement.tsx`, `useReferenceFrameworks.ts`, `useFrameworkDocuments.ts`, `useAIKnowledge.ts` | Raw `supabase.rpc('get_user_tenant_id')` |

**Problem**: Cache fragmentation (different query keys), redundant network calls, inconsistent error handling.
**Fix**: Standardize on `useTenantId()` everywhere. Delete `useTenantIdQuery`. Remove all inline RPC calls.

### 2. Direct Supabase calls in components and pages

These files bypass the service/hook layer and call Supabase directly:

- `src/components/recognition/NominationWizard.tsx` — inserts into `nomination_criteria_evaluations`
- `src/components/recognition/EndorsementRequestPicker.tsx` — inserts into `endorsement_requests` + `recognition_notifications`
- `src/pages/admin/TaskConnectors.tsx` — inserts into `unified_tasks`
- `src/pages/admin/QuestionManagement.tsx` — calls RPC directly
- `src/pages/mental-toolkit/ThoughtReframerPage.tsx` — invokes edge function directly

**Problem**: Violates separation of concerns. Business logic is trapped in UI components, making it untestable and non-reusable.
**Fix**: Extract each into a service function or mutation hook.

### 3. Dead deprecated code still in the codebase

Three deprecated exports have **zero consumers** but still ship in the bundle:

- `src/features/workload/hooks/useApprovals.ts` — shim re-export, 0 imports
- `src/features/workload/hooks/useTaskDependencies.ts` — shim, 0 imports  
- `src/hooks/org/useUsers.ts → useHasPermission()` — deprecated function, 0 imports

**Fix**: Delete the two shim files. Remove `useHasPermission` from `useUsers.ts`.

---

## HIGH — Significant Structural Issues

### 4. Inconsistent feature module boundaries

Some domains follow the `src/features/` pattern (tasks, workload, approvals, ai-generator, ai-governance, org-dashboard) while equivalent-sized domains live as scattered hooks + components:

| Domain | Hooks in `src/hooks/` | Components in `src/components/` | Should be `src/features/` |
|---|---|---|---|
| Recognition | 15 hooks | `recognition/`, `dashboard/*Recognition*` | Yes |
| Spiritual | 15 hooks | `spiritual/` | Yes |
| Crisis | `crisis/` | `crisis/` | Yes |
| Wellness/Mental Toolkit | 8 hooks | `mental-toolkit/`, `mood/`, `checkin/` | Yes |

**Problem**: Inconsistent developer experience. New contributors can't predict where domain code lives.
**Fix**: Consolidate recognition, spiritual, crisis, and wellness into `src/features/` modules with their own hooks, components, and pages.

### 5. `src/components/dashboard/` is a dumping ground (30+ files)

This directory mixes:
- Org-level analytics charts (`OrgComparisonChart`, `CategoryHealthChart`, `ResponseHeatmap`)
- Employee-facing widgets (`PersonalMoodDashboard`, `DashboardPrayerWidget`, `DashboardWorkloadWidget`)
- Recognition widgets (`DashboardVotingWidget`, `DashboardShortlistWidget`, `DashboardEndorsementRequests`)

**Problem**: No clear ownership. Dashboard components that are really feature-specific (prayer, recognition, workload) should live in their respective feature modules.
**Fix**: Move feature-specific dashboard widgets into their owning feature modules. Keep only the shared dashboard shell and overview components here.

### 6. `OrgStructure.tsx` manages 5 entity types with 10 state variables (301 lines)

This page manages branches, divisions, departments, sections, and work sites all in one component with duplicated CRUD patterns.

**Fix**: Extract each entity tab into its own component. Use the existing `useFormDialog`/`useConfirmDelete` shared patterns.

---

## MEDIUM — Improve Maintainability

### 7. `src/components/employees/` vs `src/components/users/` overlap

Both directories manage user/employee entities with similar table + dialog patterns. This appears to be a legacy split from before user management was unified.

**Fix**: Audit which components are still imported. Consolidate into the `users/` directory or a `src/features/user-management/` module.

### 8. Loose files in `src/components/` root

Four files sit at `src/components/` root level instead of in a subdirectory:
- `LanguageSelector.tsx`, `NavLink.tsx`, `ThemeToggle.tsx`, `UserMenu.tsx`

**Fix**: Move to `src/components/layout/` (they're all navigation/chrome components).

### 9. `src/data/countryCities.ts` — static data file

A single static data file in its own `data/` directory.

**Fix**: Move to `src/config/` alongside other static configuration.

### 10. `src/lib/` mixes utilities with domain logic

`src/lib/` contains both pure utilities (`utils.ts`, `logger.ts`, `cropImage.ts`) and domain-specific modules (`analytics/`, `recognition-utils.ts`, `supabase-types.ts`).

**Fix**: Move `recognition-utils.ts` to the recognition feature module. `supabase-types.ts` could move to `src/integrations/supabase/` for co-location. Keep `lib/` for truly generic utilities only.

---

## LOW — Optional Enhancements

### 11. `UserProfile.tsx` has 7 dialog state variables

The settings page manages 7 independent boolean states for dialogs. This is a candidate for the `useFormDialog` pattern or a reducer.

### 12. `CrisisRequestPage.tsx` has 10 state variables for a wizard

Multi-step wizard state could be consolidated with `useReducer` or a wizard state machine.

### 13. `queryClient` instantiated at module scope in `App.tsx`

Currently `const queryClient = new QueryClient()` sits between lazy imports and component definitions (line 97). Not a bug, but moving it before the lazy imports or into a dedicated provider file would improve readability.

### 14. `src/ai/` vs `src/hooks/ai/` vs `src/features/ai-generator/` vs `src/features/ai-governance/`

AI-related code is split across four locations. The boundaries are somewhat logical (client, hooks, generator feature, governance feature), but `src/ai/` and `src/hooks/ai/` could be consolidated into a shared AI module.

---

## Summary — Ordered Action Plan

| Step | Priority | Effort | Description |
|---|---|---|---|
| 1 | Critical | Small | Delete 3 deprecated dead-code files/functions |
| 2 | Critical | Small | Standardize all tenant ID resolution on `useTenantId()` |
| 3 | Critical | Medium | Extract direct Supabase calls from 5 components/pages into hooks |
| 4 | High | Large | Consolidate recognition (15 hooks + components) into `src/features/recognition/` |
| 5 | High | Large | Consolidate spiritual (15 hooks + components) into `src/features/spiritual/` |
| 6 | High | Medium | Consolidate crisis into `src/features/crisis/` |
| 7 | High | Medium | Consolidate wellness/mental-toolkit into `src/features/wellness/` |
| 8 | High | Medium | Break up `components/dashboard/` — move feature widgets to their modules |
| 9 | High | Small | Refactor `OrgStructure.tsx` into per-entity tab components |
| 10 | Medium | Small | Merge `components/employees/` into `components/users/` |
| 11 | Medium | Small | Move root-level layout components into `components/layout/` |
| 12 | Medium | Small | Move `recognition-utils.ts` and `supabase-types.ts` to proper locations |
| 13 | Low | Small | Consolidate `UserProfile.tsx` dialog states |
| 14 | Low | Small | Refactor `CrisisRequestPage.tsx` wizard state |
| 15 | Low | Small | Consolidate `src/ai/` + `src/hooks/ai/` |

