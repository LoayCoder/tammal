
# Move Organization Wellness to a Separate Tab Under Dashboard

## What Will Change

Instead of the current button-based view switcher, the Dashboard page will use **Tabs** (from the existing Shadcn Tabs component) to separate content into distinct tab panels. For admins, two tabs will appear:

- **Overview** -- SaaS stats (super admin only) + recent activity
- **Organization Wellness** -- The existing aggregated wellness analytics (stat cards, trend chart, mood distribution)

Non-admin users continue to see only the personal `EmployeeHome` with no tabs.

Admins who also have an employee profile will see a third tab: **My Dashboard** (personal view).

---

## Changes

### 1. Refactor `Dashboard.tsx` to Use Tabs

Replace the `DashboardViewSwitcher` button toggle with Shadcn `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`.

Tab structure for admins:

```text
[Overview]  [Organization Wellness]  [My Dashboard*]

* "My Dashboard" tab only if admin has employee profile (canSwitch = true)
```

- Default tab: `overview` (persisted in localStorage)
- Non-admins: no tabs, just `EmployeeHome`

### 2. Create `DashboardOverviewTab.tsx`

Extract the SaaS stats + recent activity into an Overview tab component:
- For super admins: `SaasStatsSection` + `AuditLogTable` (recent 5 logs)
- For tenant admins: title/welcome text + `AuditLogTable` only

### 3. Keep `OrgDashboard.tsx` As-Is

No changes needed -- it already renders the wellness stat cards, trend chart, and distribution chart. It will simply be placed inside the "Organization Wellness" `TabsContent`.

### 4. Remove `DashboardViewSwitcher.tsx`

No longer needed since Tabs replace the toggle buttons. The `useDashboardView` hook will be simplified to track the active tab key instead of `'org' | 'personal'`.

### 5. Update `useDashboardView.ts`

Change the view type from `'org' | 'personal'` to support three tab values: `'overview' | 'wellness' | 'personal'`. Continue persisting in localStorage.

### 6. Update `Header.tsx`

Remove the `DashboardViewSwitcher` rendering from the header -- tabs are now inline on the page.

### 7. Update i18n Keys

Add new keys:
- `dashboard.overviewTab` -- "Overview" / "نظرة عامة"
- `dashboard.wellnessTab` -- "Organization Wellness" / "صحة المنظمة"
- `dashboard.personalTab` -- "My Dashboard" / "لوحتي"

---

## Technical Details

### Dashboard.tsx Structure

```text
Dashboard.tsx
  +-- if loading: Skeleton
  +-- if !isAdmin: EmployeeHome (no tabs)
  +-- if isAdmin:
        Tabs (defaultValue from localStorage)
          TabsList
            TabsTrigger "overview"
            TabsTrigger "wellness"
            TabsTrigger "personal" (only if canSwitch)
          TabsContent "overview"
            +-- SaasStatsSection (super admin only)
            +-- Recent Activity card
          TabsContent "wellness"
            +-- OrgDashboard
          TabsContent "personal" (only if canSwitch)
            +-- EmployeeHome
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/dashboard/DashboardOverviewTab.tsx` | Overview tab with SaaS stats + activity |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Replace switcher with Tabs layout |
| `src/hooks/useDashboardView.ts` | Update type to 3 tab values |
| `src/components/layout/Header.tsx` | Remove DashboardViewSwitcher from header |
| `src/locales/en.json` | Add tab label keys |
| `src/locales/ar.json` | Add Arabic tab label keys |

### Files to Delete

| File | Reason |
|------|--------|
| `src/components/dashboard/DashboardViewSwitcher.tsx` | Replaced by inline Tabs |
