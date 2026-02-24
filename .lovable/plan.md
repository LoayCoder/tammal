

# Codebase Architecture Audit Report

## Executive Summary

The project is a large multi-tenant SaaS wellness platform with ~150+ files. Overall, the architecture follows reasonable conventions (feature-based folders, hooks for data, pages for routing). However, there are several structural issues that range from critical (affecting correctness and maintainability) to minor (code style improvements).

---

## Findings: Ordered from Most Critical to Optional

---

### 1. CRITICAL -- `useOrgAnalytics.ts` is a 945-line God Hook

**Problem:** This single hook contains ALL analytics computation -- 20+ database queries, client-side aggregation, trend calculations, risk scoring, org comparisons, and synthesis. It is a single `useQuery` with one massive `queryFn` that is nearly impossible to test, debug, or modify safely.

**Impact:** Any change to one metric risks breaking others. The file duplicates query patterns (e.g., fetching `employee_responses` three separate times within the same function).

**Recommendation:**
- Extract into domain-specific hooks: `useMoodAnalytics`, `useSurveyAnalytics`, `useOrgComparison`, `useRiskAnalytics`
- Move the pure computation functions (`computeOrgComparison`, `computeTopEngagers`) to `src/lib/`
- Use React Query's `useQueries` or dependent queries to compose results

---

### 2. CRITICAL -- Duplicate Batch Management Logic

**Problem:** Two hooks manage the same `question_generation_batches` table:
- `useQuestionBatches.ts` (268 lines) -- used by the Question Batches page
- `useQuestionBatchManagement.ts` (139 lines) -- a near-duplicate

Both fetch from `question_generation_batches`, both implement publish/delete mutations, but with slightly different interfaces (one uses `sonner` toast, the other uses `use-toast`). This creates divergent behavior and maintenance burden.

**Recommendation:** Consolidate into a single `useQuestionBatches` hook. Remove `useQuestionBatchManagement.ts` entirely and update any consumers.

---

### 3. HIGH -- Pervasive `as any` Type Casting (530 occurrences in hooks)

**Problem:** There are 530 `as any` casts across 29 hook files. This defeats TypeScript's safety net and indicates the Supabase types file is out of sync with the actual database schema (tables like `question_subcategories`, `question_generation_batches`, `wellness_questions` require `as any` to compile).

**Impact:** Runtime errors from incorrect column names or types go undetected until production.

**Recommendation:**
- Regenerate Supabase types to match current schema (this happens automatically, so investigate why tables are missing from the types file -- likely they were added via raw SQL rather than through the migration tool)
- For any truly dynamic fields, create explicit type definitions rather than casting

---

### 4. HIGH -- `useAuth.ts` Mixes Authentication with Login Telemetry

**Problem:** The `useAuth` hook (177 lines) embeds user-agent parsing, IP geolocation API calls, and `login_history` table inserts directly within the auth flow. This is a separation-of-concerns violation.

**Impact:**
- If the IP lookup service (`ip-api.com`) is slow, login UX is degraded
- Testing auth requires mocking external HTTP services
- The `parseUserAgent` and `getLocationInfo` utilities are not reusable

**Recommendation:**
- Extract `parseUserAgent` and `getLocationInfo` into `src/lib/deviceInfo.ts`
- Extract `recordLoginEvent` into a separate `useLoginTracker` hook or a service
- Call it from `useAuth` as a fire-and-forget side effect

---

### 5. HIGH -- `useEnhancedAIGeneration.ts` Embeds Business Logic in a Hook

**Problem:** This 482-line hook contains two full save workflows (`saveWellnessMutation` and `saveSetMutation`) that each perform 5-7 sequential database operations (auth check, tenant lookup, profile fetch, batch creation, question insertion, unified table sync). This is effectively a backend transaction implemented on the frontend.

**Impact:** No atomicity -- if step 4 fails, steps 1-3 have already committed, leaving orphaned data.

**Recommendation:**
- Move the save logic into a backend function (edge function) that handles the multi-table transaction server-side
- The hook should only call `supabase.functions.invoke('save-question-batch', { body })` and handle the response

---

### 6. MEDIUM -- `MainLayout.tsx` Fetches Tenant ID Independently

**Problem:** `MainLayout` uses a raw `useEffect` to fetch `tenant_id` from `profiles`, bypassing the existing `useAuth` / `useProfile` hooks. Multiple components across the app independently fetch tenant ID.

**Recommendation:** Create a `useTenantId()` hook (or add it to `useAuth` context) that caches the tenant ID and is consumed everywhere consistently.

---

### 7. MEDIUM -- Missing `src/services/` Layer

**Problem:** There is only one file in `src/services/` (`tenantAssets.ts`). All other data access is done directly via Supabase client calls within hooks. The service layer pattern was started but not adopted consistently.

**Recommendation:** Either:
- Commit to the service layer pattern and extract Supabase queries from hooks into `src/services/` (e.g., `analyticsService.ts`, `batchService.ts`)
- Or abandon the pattern and move `tenantAssets.ts` into a hook for consistency

---

### 8. MEDIUM -- RTL Violations in UI Components

**Problem:** `src/components/ui/select.tsx` uses physical properties (`pl-8 pr-2`) instead of logical properties (`ps-8 pe-2`). These are Shadcn defaults that were not updated per the project's strict RTL rule.

**Recommendation:** Audit all `src/components/ui/` files for `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right` and replace with logical equivalents.

---

### 9. MEDIUM -- Two Toast Systems in Use

**Problem:** The project uses both:
- `sonner` (via `import { toast } from 'sonner'`)
- Radix `useToast` (via `@/hooks/use-toast`)

Some hooks use one, some use the other, and some components import both.

**Recommendation:** Standardize on `sonner` (which is simpler) and remove the Radix toast system, or vice versa.

---

### 10. LOW -- Flat Hooks Directory (65+ files)

**Problem:** All 65+ hooks live in a flat `src/hooks/` directory with no subdirectories. Finding related hooks requires scanning file names.

**Recommendation:** Group by domain:
```text
src/hooks/
  auth/        (useAuth, usePermissions, useUserPermissions, useLoginHistory)
  analytics/   (useOrgAnalytics, useDashboardStats, useDashboardView, useCrisisAnalytics)
  questions/   (useQuestions, useQuestionBatches, useQuestionCategories, ...)
  wellness/    (useMoodHistory, useWellnessInsights, useMoodDefinitions, ...)
  spiritual/   (usePrayerLogs, useQuranSessions, useSpiritualPreferences, ...)
  org/         (useTenants, useBranches, useDepartments, useDivisions, ...)
```

---

### 11. LOW -- `App.tsx` Has 60+ Route Imports

**Problem:** `App.tsx` imports every single page component at the top level (60+ imports). No lazy loading, no route grouping.

**Impact:** Larger initial bundle; slower first load.

**Recommendation:**
- Use `React.lazy()` and `Suspense` for route-level code splitting
- Group related routes into sub-route files (e.g., `adminRoutes.tsx`, `spiritualRoutes.tsx`)

---

### 12. LOW -- `EmployeeSurvey.tsx` Has Inline Render Function

**Problem:** The `renderAnswerInput` function (120 lines) is defined as a standalone function at the bottom of `EmployeeSurvey.tsx`. While functional, it should be a proper component.

**Recommendation:** Extract into `src/components/survey/AnswerInput.tsx` as a React component with proper props typing.

---

### 13. OPTIONAL -- No Shared Constants File

**Problem:** Magic values like `MAX_BATCH_SIZE = 64` are duplicated in both `useQuestionBatches.ts` and `useEnhancedAIGeneration.ts`.

**Recommendation:** Create `src/lib/constants.ts` for shared business constants.

---

## Suggested Implementation Order

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Consolidate duplicate batch hooks (#2) | Small |
| 2 | Standardize on one toast system (#9) | Small |
| 3 | Extract shared constants (#13) | Trivial |
| 4 | Fix RTL violations in UI components (#8) | Small |
| 5 | Extract auth telemetry from useAuth (#4) | Medium |
| 6 | Create shared useTenantId hook (#6) | Small |
| 7 | Break up useOrgAnalytics (#1) | Large |
| 8 | Move save logic to edge function (#5) | Large |
| 9 | Organize hooks into subdirectories (#10) | Medium |
| 10 | Add lazy loading to routes (#11) | Medium |
| 11 | Resolve `as any` casts (#3) | Ongoing |
| 12 | Decide on services layer (#7) | Medium |
| 13 | Extract AnswerInput component (#12) | Small |

