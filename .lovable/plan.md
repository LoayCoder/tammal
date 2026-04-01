

# E2E Test Suite — Workload Intelligence (Playwright)

## Overview

Create a production-ready Playwright E2E test suite covering 5 Workload Intelligence pages: Dashboard (`/admin/workload/dashboard`), Team Command Center (`/admin/workload/team`), Executive Dashboard (`/admin/workload/executive`), Portfolio (`/admin/workload/portfolio`), and Personal Workload (`/my-workload`). Tests cover page load, filters, persistence, role-based access, and error/empty states.

## Files to Create

### 1. `playwright.config.ts`
- Base URL: `http://localhost:3000`
- Chromium-only, retries: 1, timeout: 30s
- Global setup for auth state storage

### 2. `tests/helpers/auth.ts`
- Reusable `loginAs(page, role)` helper
- Role map with TODO placeholders for credentials:
  - `admin` — super_admin or tenant_admin (accesses all `/admin/workload/*` routes)
  - `manager` — manager role (accesses `/admin/workload/team`, `/admin/workload/representative`)
  - `user` — regular employee (accesses only `/my-workload`)
- Navigates to `/auth`, fills email/password, submits, waits for redirect

### 3. `tests/workload-intelligence/page-load.spec.ts`
Tests for each page:
- **Dashboard** (`/admin/workload/dashboard`): Verify PageHeader title, 5 KPI MetricCards (Total Employees, Avg Load, Avg Utilization, At Risk, Off-Hours Workers), 3 tabs (Capacity, Objectives, Off Hours), team overview table headers
- **Team** (`/admin/workload/team`): Verify PageHeader, 4 stat cards, filter controls (status, priority, employee, source, search), member accordion, workload distribution chart area
- **Executive** (`/admin/workload/executive`): Verify page title, TAMMAL Index card, KPI row, action buttons (Run AI, Run Snapshot), strategic progress card, department workload card
- **Portfolio** (`/admin/workload/portfolio`): Verify page header, objectives and initiatives sections
- **My Workload** (`/my-workload`): Verify personal stats (active, completed, overdue), toggle group (tasks/calendar/approvals), capacity gauge section

### 4. `tests/workload-intelligence/filters.spec.ts`
Focuses on Team Command Center (`/admin/workload/team`) which has the richest filter set:
- Apply status filter → verify task badge count changes
- Apply priority filter → verify filtered tasks show correct priority badges
- Apply employee filter → verify accordion shows only that employee
- Type in search input → verify text filtering
- Apply source type filter → verify source column matches
- Clear all filters (set back to "all") → verify full list restores
- Verify member search input filters accordion members
- Verify sort dropdown changes member ordering

### 5. `tests/workload-intelligence/persistence.spec.ts`
- Navigate to Team page, apply a status filter, verify URL or UI state
- Reload page → check if filter state persists (if stored in URL params) or resets to defaults
- Navigate to Executive page, click a tab, reload → verify tab state
- Navigate to Dashboard, switch to Objectives tab, reload → verify tab resets to default (expected behavior for non-URL-persisted tabs)

### 6. `tests/workload-intelligence/roles.spec.ts`
Based on route guards in App.tsx:
- **Admin user**: Can access `/admin/workload/dashboard`, `/admin/workload/executive`, `/admin/workload/portfolio`, `/admin/workload/team`
- **Manager user**: Can access `/admin/workload/team` but NOT `/admin/workload/dashboard` or `/admin/workload/executive` (AdminRoute-only)
- **Regular user**: Navigating to any `/admin/workload/*` route should redirect to unauthorized/home; CAN access `/my-workload`
- Verify redirect behavior for unauthorized routes

### 7. `tests/workload-intelligence/empty-and-error-states.spec.ts`
- Dashboard Capacity tab: If no team data, verify "No data" message in table and chart area
- Dashboard Objectives tab: If no objectives, verify empty state message
- Team page: Apply impossible filter combination → verify empty accordion or "no results" state
- Executive page: Verify graceful rendering when analytics return empty arrays (no crash, skeleton or zero values shown)
- My Workload: If user has no tasks, verify empty task list renders cleanly

## Technical Details

- **Selectors**: Use `getByRole('heading')`, `getByText()`, `getByPlaceholder()`, `getByRole('tab')`, `getByRole('combobox')` for Shadcn Select triggers
- **Shadcn Select interaction**: Click trigger → use `page.locator('[role="option"]')` to select values
- **Wait strategy**: Use `waitForSelector` or `expect(locator).toBeVisible()` — no arbitrary `waitForTimeout`
- **Tab switching**: Click `role=tab` with matching text, then assert content visibility
- **i18n awareness**: Use TODO comments for translated strings since actual text depends on locale; provide English defaults
- **No mock/intercept by default**: Tests run against live backend; network intercept used only in error-state test

## Estimated Output
- 7 new files, ~800 lines total
- Each file independently runnable via `npx playwright test tests/workload-intelligence/<file>`

