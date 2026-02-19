

# Dual Dashboard: Organization View + Personal View for Admin Users

## Current State Analysis

The system **already has** the correct architecture for most of this:
- RBAC uses a separate `user_roles` table (not on profiles) -- secure and scalable
- RLS enforces `tenant_id` isolation on all tables -- no cross-tenant leakage
- Single user account can hold both `tenant_admin` role AND have an employee record

**What's missing:**
- Admins are locked to the SaaS admin dashboard and **cannot** see their personal wellness view
- There is no **Organizational Wellness Dashboard** (aggregated mood scores, participation rates, team health)
- No **view switcher** in the UI to toggle between views

## What Will Change

### 1. Dashboard View Switcher (Header Component)

A toggle component in the header (visible only to admins who also have an employee profile) that switches between:
- **Organization View** -- aggregated, anonymized tenant wellness analytics
- **My Dashboard** -- personal check-ins, mood history, points, streaks

The selected view is persisted in `localStorage` so it survives page reloads without extra API calls.

### 2. New Organizational Wellness Dashboard

A new `OrgDashboard.tsx` component replacing the current SaaS-stats-only admin view on `/`. It will show:

- **Team Wellness Score** (average mood across tenant, anonymized)
- **Survey Participation Rate** (% of employees who completed check-ins this week/month)
- **Employee Count** (active employees in tenant)
- **Engagement Trend** (7-day/30-day mood trend chart, aggregated)
- **Risk Distribution** (how many employees in thriving/watch/at-risk zones -- counts only, no names)
- **Recent Activity** (audit logs, kept from current dashboard)

For **Super Admins**: The existing SaaS platform stats (tenants, subscriptions, revenue) remain visible as an additional section above the wellness metrics.

**Privacy guarantee**: All queries use `COUNT()`, `AVG()`, and `GROUP BY` aggregations. No individual employee IDs, names, or raw answers are ever fetched.

### 3. Refactored Dashboard Router

`Dashboard.tsx` becomes a thin router:

```text
if (isAdmin && viewMode === 'org')  --> OrgDashboard
if (isAdmin && viewMode === 'personal') --> EmployeeHome (personal)
if (!isAdmin) --> EmployeeHome (personal, no switcher)
```

### 4. Sidebar Updates

- The "Wellness" section (Daily Check-in link) becomes visible to admins too (they are also employees)
- The Dashboard label adapts to show the current view context

### 5. New Data Hook: `useOrgWellnessStats`

Fetches aggregated, anonymized wellness data scoped to the admin's `tenant_id`:

- Average mood score (last 7 days)
- Check-in participation rate
- Active employee count
- Mood distribution (count per mood level)
- Burnout zone distribution (count per zone)

All queries are filtered by `tenant_id` via RLS -- no extra client-side filtering needed.

---

## Security Guarantees

- **No individual data exposure**: Org dashboard uses only aggregate SQL (`AVG`, `COUNT`, `GROUP BY`). No employee names or raw answers.
- **Tenant isolation**: All queries go through existing RLS policies with `tenant_id = get_user_tenant_id(auth.uid())`.
- **Personal data stays personal**: The personal dashboard queries use `employee_id` matched to `auth.uid()` -- same as today.
- **No new RLS policies needed**: Existing policies already support these access patterns.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardViewSwitcher.tsx` | Toggle component for org/personal view |
| `src/components/dashboard/OrgDashboard.tsx` | Organizational wellness analytics dashboard |
| `src/hooks/useOrgWellnessStats.ts` | Aggregated wellness data hook |
| `src/hooks/useDashboardView.ts` | View state management (localStorage + role check) |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Refactor to use view switcher, render OrgDashboard or EmployeeHome |
| `src/components/layout/Header.tsx` | Add DashboardViewSwitcher on dashboard route |
| `src/components/layout/AppSidebar.tsx` | Show wellness/check-in links to admins with employee profiles |
| `src/pages/EmployeeHome.tsx` | Fix RTL violation (`mx-auto` on lines 169, 176, 183) |
| `src/locales/en.json` | New i18n keys for org dashboard and view switcher |
| `src/locales/ar.json` | Arabic translations |

---

## Technical Details

### View Switcher Logic

```text
useDashboardView():
  - Reads role from useUserPermissions / useHasRole
  - Reads employee profile from useCurrentEmployee
  - If admin + has employee profile: can toggle, defaults to 'org'
  - If admin + no employee profile: locked to 'org'
  - If not admin: locked to 'personal' (switcher hidden)
  - Persists choice in localStorage key 'dashboard-view'
```

### Org Wellness Stats Query Pattern

```text
useOrgWellnessStats(tenantId):
  1. Count active employees WHERE tenant_id = X AND deleted_at IS NULL
  2. Count mood_entries in last 7 days WHERE tenant_id = X
  3. AVG(score) from mood_entries in last 7 days
  4. Count by mood level (GROUP BY level) for distribution
  5. Participation = (distinct employees with entries / total employees) * 100
```

All queries leverage existing RLS policies -- tenant admins can already SELECT from `employees` and `mood_entries` within their tenant.

### Dashboard Component Structure

```text
Dashboard.tsx
  +-- if loading: Skeleton
  +-- if admin:
  |     +-- DashboardViewSwitcher (org | personal)
  |     +-- if 'org': OrgDashboard
  |     +-- if 'personal': EmployeeHome
  +-- if not admin:
        +-- EmployeeHome
```

### RTL Compliance

- View switcher uses `gap-` and logical properties only
- No `ml-`/`mr-` in new components
- Fix existing `mx-auto` violations in `EmployeeHome.tsx` (lines 169, 176, 183)

