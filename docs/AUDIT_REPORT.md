# Comprehensive Audit Report: Tammal MVP Branch

**Project**: Tammal - Workforce/Org Management System  
**Stack**: React 18 + TypeScript + Vite + Supabase + TanStack Query  
**Audit Date**: 2026-04-30  
**Branch**: mvp  

---

## Executive Summary

This audit covers 854 TypeScript/TSX files across 6 key areas. The project demonstrates **strong foundation** with lazy-loaded routes, React Query for data fetching, and RLS-hardened Supabase policies. However, **critical TypeScript strictness gaps** and **architectural debt** from rapid iteration require immediate attention.

**Key Stats**:
- 854 TypeScript files, 119,810 total lines
- 43 test files (5% coverage)
- 100+ Supabase migrations with RLS hardening
- TypeScript `strict: false`, `noImplicitAny: false`
- 150+ instances of `any` type

---

## 1. Code Quality

### 1.1 TypeScript Configuration [P0 - Critical]

**Finding**: TypeScript strict mode is **disabled** across the board.

**Evidence**:
- `tsconfig.json:4` – `"noImplicitAny": false`
- `tsconfig.json:5` – `"noUnusedLocals": false`
- `tsconfig.json:6` – `"noUnusedParameters": false`
- `tsconfig.json:13` – `"strictNullChecks": false`
- `tsconfig.app.json:16` – `"noImplicitAny": false`
- `tsconfig.app.json:25` – `"strict": false`

**Impact**: 
- Unsafe `any` types proliferate (150+ occurrences)
- Null/undefined crashes at runtime
- Weakened IDE assistance and refactoring safety

**Files with heavy `any` usage**:
```
src/lib/analytics/queries.ts:61-62      – Supabase query builder typed as `any`
src/services/tenantAssets.ts:24,48,61   – `.from('tenant_assets' as any)`
src/services/moodTaggingService.ts:20,25 – `.update({ mood_levels: updated } as any)`
src/hooks/org/useUsers.ts:66,84,118     – Profile data typed as `any`
src/hooks/recognition/*.ts               – JSON columns typed as `Record<string, any>`
```

**Recommendation**: Enable strict mode incrementally per-file with `// @ts-strict-ignore` suppressions for legacy code.

---

### 1.2 Component Complexity [P1 - Important]

**Finding**: Multiple components exceed maintainability thresholds.

**Large Files** (>500 LOC):
| File | Lines | Issue |
|------|-------|-------|
| `src/integrations/supabase/types.ts` | 9,121 | Auto-generated, acceptable |
| `src/pages/dev/DesignSystemPage.tsx` | 929 | Dev-only showcase, low priority |
| `src/components/layout/AppSidebar.tsx` | 769 | **P1**: Monolithic navigation logic |
| `src/features/ai-generator/components/ConfigPanel.tsx` | 708 | **P1**: 18 `useState` calls, no extraction |
| `src/lib/analytics/queries.ts` | 638 | **P2**: Analytics logic, can be split |
| `src/hooks/crisis/useCrisisSupport.ts` | 566 | **P0**: 6 hooks bundled into one file |

**Evidence – `useCrisisSupport.ts`**:
- Lines 1-566: Exports 6+ hooks (`useFirstAiders`, `useCrisisCases`, `useEmergencyContacts`, etc.)
- No separation of concerns
- Violates single-responsibility principle

**Recommendation**: Extract each hook into its own file under `src/hooks/crisis/`.

---

### 1.3 State Management Explosion [P1]

**Finding**: `UnifiedUserManagement.tsx` has **20 independent `useState` calls** with no reducer or custom hook.

**Evidence**:
```typescript
src/pages/admin/UnifiedUserManagement.tsx:37-67
  const [selectedTenantId, setSelectedTenantId] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>()
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatus>()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invitingEmployee, setInvitingEmployee] = useState<Employee | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null)
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction>('deactivate')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isPermissionMatrixOpen, setIsPermissionMatrixOpen] = useState(false)
```

**Impact**: Hard to reason about state dependencies, high risk of bugs.

**Recommendation**: Extract to `useUnifiedUserManagementState()` custom hook with reducer pattern.

---

### 1.4 Naming Conventions [P2]

**Finding**: Inconsistent naming across hooks and services.

**Examples**:
- `useUsers` vs `useUnifiedUsers` – unclear distinction
- `useCrisisSupport` exports 6+ hooks – naming doesn't reflect multi-export
- File `queries.ts` contains analytics logic – should be `analyticsQueries.ts`

**Recommendation**: Establish naming convention guide in `docs/CONVENTIONS.md`.

---

## 2. Architecture

### 2.1 File Organization [P2]

**Finding**: Feature-based organization is **partially adopted** but inconsistent.

**Current Structure**:
```
src/
  features/          ← Feature modules (good)
    ai-generator/
    tasks/
    workload/
  hooks/             ← Shared hooks (mixed concerns)
    auth/
    org/
    crisis/
    recognition/
    wellness/
  pages/             ← Route components (acceptable)
  components/        ← Shared UI (acceptable)
  services/          ← Business logic (underutilized)
```

**Issue**: `hooks/` directory mixes domain logic with infrastructure. Crisis hooks belong in `features/crisis/hooks/`.

**Recommendation**: 
1. Move domain hooks into feature folders
2. Keep only infrastructure hooks (auth, query utils) in `src/hooks/`

---

### 2.2 State Management [P1]

**Finding**: No global state library; **all state is React Query + local component state**.

**Evidence**:
- Zero Zustand/Redux imports
- `App.tsx:105` – Single `QueryClient` instance
- Dashboard stats prop-drilled 3 levels: `OrgDashboard → Tab → Chart`

**Trade-offs**:
- ✅ Simple mental model
- ✅ Server state handled by React Query
- ❌ UI state (filters, modals) re-created on every mount
- ❌ No shared state between sibling routes

**Recommendation**: 
- **P2**: Introduce Zustand for cross-route UI state (filters, preferences)
- Keep React Query for server data

---

### 2.3 Data Flow [P1]

**Finding**: Tightly coupled Supabase client usage throughout components.

**Evidence**:
```typescript
src/components/profile/ChangePasswordDialog.tsx:45
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })

src/components/profile/ChangeEmailDialog.tsx:38
  const { error } = await supabase.auth.updateUser({ email: newEmail })

src/features/workload/hooks/usePersonalTodos.ts:91
  const { data, error } = await (supabase as any).from('personal_todos').select('*')
```

**Issue**: 
- Auth operations bypass React Query
- No centralized error handling
- Mutation logic embedded in UI components

**Recommendation**: 
1. Create `src/services/authService.ts` with wrapped auth methods
2. Wrap with React Query mutations for consistent error handling

---

### 2.4 Separation of Concerns [P1]

**Finding**: Business logic mixed with UI logic.

**Example – `useRecognitionMonitor.ts:123-167`**:
```typescript
// Redundant org data fetching instead of composing org hooks
const { data: depts } = useQuery({
  queryKey: ['depts-for-monitor', tenantId],
  queryFn: async () => { /* fetch departments */ }
})
const { data: divisions } = useQuery({
  queryKey: ['divisions-for-monitor', tenantId],
  queryFn: async () => { /* fetch divisions */ }
})
```

**Better approach**: Compose `useDepartments()` and `useDivisions()` hooks.

---

## 3. Performance

### 3.1 Lazy Loading [✅ Good]

**Finding**: Route-level code splitting is **well-implemented**.

**Evidence**:
```typescript
src/App.tsx:24-102
const TenantManagement = lazy(() => import("@/pages/admin/TenantManagement"));
const PlanManagement = lazy(() => import("@/pages/admin/PlanManagement"));
// ... 78 more lazy-loaded routes
```

**Strengths**:
- Eager-load: Auth, Dashboard, AcceptInvite (critical path)
- Lazy-load: All admin/feature pages
- Suspense boundaries with skeleton fallbacks

**No action needed** – this area is already optimized.

---

### 3.2 Unnecessary Re-renders [P1]

**Finding**: Large components lack memoization.

**Examples**:
- `AppSidebar.tsx:769` – No `useMemo` for navigation tree
- `OrgDashboard.tsx` – Stats computed inline on every render
- `DashboardPrayerWidget.tsx:641` – Islamic calendar calculations not memoized

**Recommendation**: Add `useMemo` for expensive computations and `React.memo` for large child components.

---

### 3.3 Query Optimization [P2]

**Finding**: React Query configured conservatively.

**Evidence**:
```typescript
src/App.tsx:105-115
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,   // 30s
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

**Opportunity**: Increase `staleTime` for static data (e.g., org structure, plans) to 5-10 minutes.

---

### 3.4 Bundle Size [P2 - Unknown]

**Finding**: No bundle analysis available in scripts.

**Evidence**:
```json
package.json:6-12
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

**Missing**: `vite-bundle-visualizer` or `rollup-plugin-visualizer`.

**Recommendation**: Add bundle analysis script and audit largest dependencies.

---

## 4. Security

### 4.1 Environment Variables [✅ Good]

**Finding**: Env vars properly handled.

**Evidence**:
```typescript
src/integrations/supabase/client.ts:5-6
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

**Strengths**:
- `.env` in `.gitignore`
- Vite's `import.meta.env` for type safety
- Keys prefixed with `VITE_` (Vite convention)

**Verified**: `.gitignore:2` includes `.env` and `.env.*`.

---

### 4.2 Auth Handling [P1]

**Finding**: Auth logic **partially centralized** but inconsistent.

**Evidence**:
```typescript
src/providers/AuthProvider.tsx     – Centralized auth context ✅
src/hooks/auth/useAuth.ts          – Auth state hook ✅

BUT:
src/components/profile/ChangePasswordDialog.tsx:45
  await supabase.auth.updateUser({ password: newPassword })  ❌ Direct call

src/components/profile/ChangeEmailDialog.tsx:38
  await supabase.auth.updateUser({ email: newEmail })  ❌ Direct call
```

**Issue**: Profile dialogs bypass `AuthProvider` and React Query, leading to:
- No optimistic updates
- Inconsistent error handling
- State sync issues

**Recommendation**: Wrap all auth mutations in React Query and expose via `useAuth`.

---

### 4.3 Input Validation [P0 - Critical]

**Finding**: Zod validation is **inconsistent**.

**Evidence – Files using Zod**:
```
src/pages/crisis/CrisisRequestPage.tsx
src/pages/Auth.tsx
src/components/org/*.tsx (DivisionSheet, DepartmentSheet, BranchSheet)
```

**Missing validation** in 40+ forms:
- `src/components/users/UserEditDialog.tsx` – User profile updates
- `src/components/workload/*.tsx` – Task/objective forms
- `src/components/recognition/*.tsx` – Nomination forms

**Risk**: 
- SQL injection via unvalidated inputs
- XSS via unsanitized text fields
- Type coercion errors

**Recommendation**: 
1. **P0**: Add Zod schemas for all mutation inputs
2. Integrate with `react-hook-form` resolver: `@hookform/resolvers/zod`

---

### 4.4 RLS Policies [✅ Good, P2 improvements]

**Finding**: Supabase RLS is **well-hardened** with tenant isolation.

**Evidence**:
```sql
supabase/migrations/20260121000001_rls_hardening.sql:47-57
CREATE POLICY "Users can view scoped employees" ON public.employees
  FOR SELECT USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.has_tenant_wide_access(auth.uid())
      OR (branch_id IS NOT NULL AND branch_id = ANY(public.get_user_accessible_branches(auth.uid())))
      OR (site_id IS NOT NULL AND site_id = ANY(public.get_user_accessible_sites(auth.uid())))
    )
    AND deleted_at IS NULL
  );
```

**Strengths**:
- 100+ migrations with explicit RLS policies
- Tenant isolation via `tenant_id` checks
- Helper functions: `get_user_tenant_id()`, `has_role()`, etc.

**Minor improvement (P2)**: Add automated RLS policy tests to prevent regressions.

---

### 4.5 XSS Protection [✅ Good, 1 exception]

**Finding**: React's default XSS protection is active; **1 `dangerouslySetInnerHTML` usage**.

**Evidence**:
```typescript
src/components/ui/chart.tsx:70
  dangerouslySetInnerHTML={{
    __html: `...CSS variables...`
  }}
```

**Context**: Used for injecting CSS custom properties for Recharts theming.

**Risk**: Low – content is static and controlled.

**Recommendation**: Keep as-is but add comment explaining safety.

---

## 5. Best Practices

### 5.1 Error Handling [P1]

**Finding**: Inconsistent error boundaries and `try-catch` usage.

**Evidence**:
- `App.tsx:13-14` – Root-level error boundaries ✅
- `App.tsx:160,169,227,237,250,263` – Route-group error boundaries ✅

**BUT**: 7 data-heavy pages **lack component-level error boundaries**:
- `pages/settings/UserProfile.tsx`
- `pages/admin/RecognitionResults.tsx`
- `pages/admin/AIGovernance.tsx`
- `pages/admin/AuditLogs.tsx`
- `pages/recognition/NominationApprovalsPage.tsx`
- `pages/recognition/MyNominationsPage.tsx`
- `pages/admin/TaskConnectors.tsx`

**Recommendation**: Wrap each data section in `<ErrorBoundary>` with user-friendly fallback.

---

### 5.2 Testing Coverage [P0 - Critical]

**Finding**: **Only 43 test files** across 854 source files (5% coverage).

**Evidence**:
```bash
find src -name "*.test.ts*" | wc -l
43
```

**Test distribution**:
- AI modules: 15 tests ✅ (good coverage)
- Governance: 5 tests
- Hooks: 6 tests
- Components: 2 tests ❌ (critical gap)
- Pages: 1 smoke test ❌

**Missing critical tests**:
- Auth flows (login, signup, password reset)
- User management CRUD operations
- Crisis support matching logic
- Recognition nomination workflow
- Workload calculation engine

**Recommendation**: 
1. **P0**: Add integration tests for auth and CRUD flows
2. **P1**: Add unit tests for business logic hooks
3. **P2**: Raise coverage target to 60% for critical paths

---

### 5.3 Accessibility [P2]

**Finding**: Accessibility is **partially implemented**.

**Evidence – Good practices**:
```typescript
src/components/ui/alert.tsx:25
  <div role="alert" ...>

src/components/ui/pagination.tsx:10
  aria-label="pagination"

src/components/layout/AppSidebar.tsx:391,759
  aria-label={t('accessibility.toggleSidebar')}
```

**Missing**:
- No `axe-core` or `eslint-plugin-jsx-a11y` in devDependencies
- No keyboard navigation tests
- Inconsistent focus management in modals

**Recommendation**: 
1. Install `eslint-plugin-jsx-a11y`
2. Add keyboard nav tests for critical flows
3. Audit focus traps in dialog components

---

### 5.4 Responsive Design [✅ Good]

**Finding**: Tailwind CSS with responsive utilities is well-utilized.

**Evidence**:
```typescript
src/pages/Dashboard.tsx:37-45
<TabsTrigger className="flex-1 px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
```

**No major issues** – Tailwind breakpoints are used consistently.

---

## 6. Developer Experience

### 6.1 Build Scripts [P2]

**Finding**: Missing critical development scripts.

**Evidence**:
```json
package.json:6-12
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

**Missing**:
- ❌ `typecheck` – No standalone type-checking script
- ❌ `test:watch` – Developers must manually add `--watch`
- ❌ `test:coverage` – No coverage reporting
- ❌ `analyze` – No bundle analysis
- ❌ `format` – No Prettier script

**Recommendation**: Add:
```json
"typecheck": "tsc --noEmit",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"analyze": "vite-bundle-visualizer",
"format": "prettier --write \"src/**/*.{ts,tsx}\""
```

---

### 6.2 Linting Rules [P1]

**Finding**: ESLint is **too permissive**.

**Evidence**:
```javascript
eslint.config.js:23-24
"@typescript-eslint/no-unused-vars": "off",
```

**Also disabled** (via tsconfig):
- `noUnusedLocals: false`
- `noUnusedParameters: false`

**Impact**: Dead code accumulates, reducing maintainability.

**Recommendation**: Enable unused-vars rule with `argsIgnorePattern: "^_"` for intentionally unused params.

---

### 6.3 Documentation [P1]

**Finding**: Minimal project documentation.

**Evidence**:
- `README.md` – Generic Lovable template, no project-specific info
- No `docs/ARCHITECTURE.md`
- No `docs/CONVENTIONS.md`
- No `docs/SETUP.md`

**Recommendation**: Create:
1. `docs/ARCHITECTURE.md` – Explain feature structure, state management, data flow
2. `docs/SETUP.md` – Local dev setup, environment variables, Supabase config
3. `docs/CONVENTIONS.md` – Naming, folder structure, testing standards

---

### 6.4 Environment Setup [P2]

**Finding**: No `.env.example` file.

**Evidence**: `.gitignore:4` excludes `.env.example` from ignore, but file doesn't exist.

**Recommendation**: Create `.env.example` with:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SENTRY_DSN=
```

---

## Priority Matrix

### P0 – Critical (Security & Reliability)

| Priority | Finding | Files/Lines | Impact |
|----------|---------|-------------|--------|
| P0 | TypeScript strict mode disabled | `tsconfig.json:4,5,6,13` | Runtime errors, unsafe `any` |
| P0 | Input validation missing (40+ forms) | `components/users/`, `components/workload/` | SQL injection, XSS risk |
| P0 | Test coverage at 5% | `src/` (43/854 files) | Production bugs undetected |
| P0 | `useCrisisSupport.ts` bundles 6 hooks | `hooks/crisis/useCrisisSupport.ts:1-566` | Unmaintainable, high bug risk |

### P1 – Important (Maintainability & Performance)

| Priority | Finding | Files/Lines | Impact |
|----------|---------|-------------|--------|
| P1 | 20 `useState` in one component | `UnifiedUserManagement.tsx:37-67` | Hard to debug state bugs |
| P1 | Auth mutations bypass React Query | `profile/{ChangePasswordDialog,ChangeEmailDialog}.tsx` | Inconsistent error handling |
| P1 | No component-level error boundaries | 7 pages (UserProfile, RecognitionResults, etc.) | Entire page crashes on error |
| P1 | Large components (>500 LOC) | `AppSidebar.tsx:769`, `ConfigPanel.tsx:708` | Hard to test and refactor |
| P1 | Prop drilling 3 levels deep | `OrgDashboard.tsx:62-74` | Brittle component tree |
| P1 | Missing lint rules | `eslint.config.js:23-24` | Dead code accumulates |
| P1 | No documentation | `docs/` (empty) | Onboarding friction |

### P2 – Nice-to-Have (Polish & DX)

| Priority | Finding | Files/Lines | Impact |
|----------|---------|-------------|--------|
| P2 | Feature folder structure inconsistent | `hooks/` vs `features/` | Mental model confusion |
| P2 | No global state library | Architecture-wide | Recreated UI state |
| P2 | Query staleTime too conservative | `App.tsx:108` | Unnecessary refetches |
| P2 | No bundle analysis | `package.json:6-12` | Unknown performance bottlenecks |
| P2 | RLS policies lack tests | `supabase/migrations/` | Regression risk |
| P2 | Accessibility tooling missing | `package.json` | A11y regressions undetected |
| P2 | Missing `.env.example` | Root directory | Setup friction |
| P2 | Missing npm scripts | `package.json:6-12` | Manual workflow overhead |

---

## Step-by-Step Improvement Plan

### Wave 1: Critical Security & Type Safety (Week 1-2)

**Goal**: Eliminate critical vulnerabilities and type unsafety.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 1.1 | Enable TypeScript strict mode | `tsconfig.json`, `tsconfig.app.json` | `npm run typecheck` passes |
| 1.2 | Add `// @ts-strict-ignore` to legacy files | 50-100 files with `any` | Gradual migration plan |
| 1.3 | Create Zod schemas for all forms | `components/users/`, `components/workload/` | All mutations validated |
| 1.4 | Split `useCrisisSupport.ts` into 6 files | `hooks/crisis/` | Each hook <100 LOC |
| 1.5 | Wrap auth mutations in React Query | `components/profile/*.tsx` | Error handling unified |

**DoD**: 
- ✅ No new `any` types added
- ✅ All user inputs validated with Zod
- ✅ Auth flow consistent

---

### Wave 2: Testing & Observability (Week 3-4)

**Goal**: Establish safety net for refactoring.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 2.1 | Add integration tests for auth flows | `tests/integration/auth/` | Login, signup, password reset covered |
| 2.2 | Add unit tests for business logic hooks | `features/*/hooks/*.test.ts` | 60% coverage for critical hooks |
| 2.3 | Add Sentry error tracking validation | `lib/sentry.ts` | Errors tagged with user context |
| 2.4 | Add bundle analysis script | `package.json` | Track bundle size over time |
| 2.5 | Add component-level error boundaries | 7 pages (UserProfile, etc.) | Partial page failures isolated |

**DoD**:
- ✅ Test coverage >40%
- ✅ Error boundaries on all data-heavy pages
- ✅ Bundle size tracked in CI

---

### Wave 3: Architecture Refactor (Week 5-6)

**Goal**: Improve maintainability and scalability.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 3.1 | Extract `useUnifiedUserManagementState()` | `pages/admin/UnifiedUserManagement.tsx` | <10 `useState` calls in component |
| 3.2 | Move domain hooks to feature folders | `hooks/ → features/*/hooks/` | Clear domain boundaries |
| 3.3 | Introduce Zustand for UI state | `stores/uiStore.ts` | Filters persist across routes |
| 3.4 | Create `authService.ts` abstraction | `services/authService.ts` | All auth calls go through service |
| 3.5 | Compose org hooks instead of duplicating queries | `hooks/recognition/useRecognitionMonitor.ts` | Remove redundant queries |

**DoD**:
- ✅ State management patterns documented
- ✅ No Supabase client usage outside services/hooks
- ✅ Domain boundaries clear

---

### Wave 4: Performance Optimization (Week 7)

**Goal**: Reduce re-renders and improve perceived performance.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 4.1 | Add `useMemo` to expensive computations | `AppSidebar.tsx`, `OrgDashboard.tsx` | React DevTools Profiler shows <50% re-renders |
| 4.2 | Increase `staleTime` for static data | `App.tsx:105` | Network tab shows fewer refetches |
| 4.3 | Add `React.memo` to large child components | `components/dashboard/*.tsx` | Profiler confirms memo hits |
| 4.4 | Analyze and tree-shake unused dependencies | `package.json` | Bundle size reduced by 10-20% |

**DoD**:
- ✅ Bundle size reduction documented
- ✅ Re-render frequency reduced

---

### Wave 5: Developer Experience (Week 8)

**Goal**: Improve onboarding and workflow ergonomics.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 5.1 | Create project documentation | `docs/ARCHITECTURE.md`, `docs/SETUP.md`, `docs/CONVENTIONS.md` | New dev onboards in <1 hour |
| 5.2 | Add missing npm scripts | `package.json` | `typecheck`, `test:watch`, `format`, `analyze` |
| 5.3 | Enable strict lint rules | `eslint.config.js` | Dead code flagged |
| 5.4 | Create `.env.example` | Root directory | Setup instructions complete |
| 5.5 | Add `eslint-plugin-jsx-a11y` | `eslint.config.js` | A11y issues caught pre-commit |

**DoD**:
- ✅ All scripts documented
- ✅ New developer setup <30 minutes

---

### Wave 6: Polish & A11y (Week 9)

**Goal**: Production-ready quality.

| Step | Action | Files | Verification |
|------|--------|-------|--------------|
| 6.1 | Audit keyboard navigation | All modal/dialog components | Tab order logical |
| 6.2 | Add focus trap tests | `tests/a11y/` | Focus stays in modal |
| 6.3 | Add automated RLS policy tests | `tests/db/rls.test.ts` | Tenant isolation verified |
| 6.4 | Update README with project-specific info | `README.md` | Reflects actual project |

**DoD**:
- ✅ No A11y violations in critical flows
- ✅ RLS policies tested

---

## Traceability Matrix

| Wave | Target Areas | Key Goals | Verification |
|------|-------------|-----------|--------------|
| 1 | `tsconfig.json`, Forms, Auth, Crisis hooks | Close security gaps, enable strict typing | `typecheck` passes, all inputs validated |
| 2 | `tests/`, Error boundaries, Bundle analysis | Build safety net | 40%+ coverage, errors isolated |
| 3 | State management, Hooks, Services | Improve maintainability | Domain boundaries clear, no direct Supabase calls |
| 4 | Components, Query config, Dependencies | Reduce bundle and re-renders | 10-20% bundle reduction, <50% re-renders |
| 5 | `docs/`, Scripts, Lint rules, `.env.example` | Improve DX | <30 min setup, all scripts work |
| 6 | A11y, RLS tests, Polish | Production-ready | No A11y violations, RLS verified |

---

## Appendix: Tool Recommendations

### Development
- **TypeScript**: Gradual strict mode with `@ts-strict-ignore`
- **Validation**: Zod + `@hookform/resolvers`
- **State**: Zustand (v4+) for UI state
- **Testing**: Vitest + Testing Library + Playwright

### Code Quality
- **Linting**: ESLint + `jsx-a11y` plugin
- **Formatting**: Prettier with auto-format on save
- **Type Coverage**: `type-coverage` CLI tool

### Performance
- **Bundle Analysis**: `vite-bundle-visualizer`
- **Profiling**: React DevTools Profiler
- **Lighthouse**: CI integration for regression detection

### Security
- **RLS Testing**: Custom `tests/db/rls.test.ts` suite
- **Dependency Audit**: `npm audit` + Dependabot

---

## Conclusion

Tammal's MVP branch demonstrates **strong fundamentals** with modern tooling, but rapid iteration has left **critical technical debt**. The disabled TypeScript strict mode and sparse test coverage pose **production risk**.

**Recommended Focus**: 
1. **Week 1-2**: Type safety + input validation (P0)
2. **Week 3-4**: Testing + observability (P0)
3. **Week 5-6**: Architecture cleanup (P1)

Following this plan will transform Tammal from **MVP** to **production-ready** while maintaining velocity.
