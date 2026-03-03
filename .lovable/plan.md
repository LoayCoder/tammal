

## Representative Locking for Strategic Hierarchy

### Current State
- The Objectives page (`/admin/workload/objectives` and `/:id`) is behind `ManagerOrAdminRoute` — accessible to super_admin, tenant_admin, and manager roles.
- Lock/unlock buttons exist on Objectives, Initiatives, and Actions (in `ObjectiveDetail.tsx`).
- Representatives have their own page (`/admin/workload/representative`) but **no access** to the strategic hierarchy pages.
- The `useRepresentativeTasks` hook already exposes `isRepresentative`.

### What Needs to Change

#### 1. Route Access — Allow Representatives to View Objectives
Create a new route guard `ManagerAdminOrRepRoute` (or extend `ManagerOrAdminRoute`) that also checks if the user has representative assignments. Apply it to:
- `/admin/workload/objectives`
- `/admin/workload/objectives/:id`

**File:** `src/components/auth/ManagerOrAdminRoute.tsx` — add representative check using a query to `representative_assignments`.

#### 2. Role-Based UI in ObjectiveDetail
Representatives should see the strategic hierarchy as **read-only with lock capability**:
- **Can:** Lock objectives, initiatives, and actions (but not unlock — only admins/managers unlock).
- **Cannot:** Create, edit, or delete objectives/initiatives/actions.

**File:** `src/pages/admin/ObjectiveDetail.tsx`
- Import `useRepresentativeTasks` to get `isRepresentative`.
- Hide "Add Initiative", "Add Action", Edit, and Delete buttons when user is representative (not manager/admin).
- Show lock button for representatives, hide unlock button (only managers/admins can unlock).
- When an item is locked: edit/delete buttons are already hidden. Status updates, evidence, and notes remain available via the existing action dialog pattern.

#### 3. Sidebar Visibility
Ensure the Objectives nav link is visible to representatives.

**File:** `src/components/layout/AppSidebar.tsx` — the objectives link already has `access: 'all'`, so it should be visible. Verify it renders for representative users.

#### 4. Translation Keys
Add any missing keys for representative-specific lock messaging (e.g., "Only managers can unlock").

**Files:** `src/locales/en.json`, `src/locales/ar.json`

### Summary of File Changes

| File | Change |
|---|---|
| `src/components/auth/ManagerOrAdminRoute.tsx` | Add representative assignment check as an alternative access path |
| `src/pages/admin/ObjectiveDetail.tsx` | Conditionally show/hide CRUD and lock/unlock buttons based on role (manager vs representative) |
| `src/hooks/workload/useRepresentativeTasks.ts` | Potentially extract a lightweight `useIsRepresentative` hook for reuse |
| `src/locales/en.json` | Add representative lock-related labels |
| `src/locales/ar.json` | Add Arabic translations for same |

