
## Add Editable Risk Level Mapping to Crisis Settings

### Overview
Currently, the Risk Level Mapping in the Rules tab is **hardcoded** in the component and in a database function (`map_intent_to_risk`). This plan makes it fully dynamic -- admins can **add, edit, and delete** risk mappings from the UI, backed by a new database table.

### 1. Database: Create `mh_risk_mappings` Table

```text
mh_risk_mappings
  - id (uuid, PK)
  - tenant_id (uuid, FK to tenants, NOT NULL)
  - intent (text, NOT NULL) -- e.g. 'self_harm', 'anxiety', custom values
  - risk_level (text, NOT NULL) -- 'high', 'moderate', 'low'
  - action_description (text) -- optional custom action text
  - sort_order (integer, default 0)
  - is_default (boolean, default false) -- system-seeded rows
  - created_at, updated_at, deleted_at (timestamps)
```

- **RLS policy**: tenant isolation via `tenant_id = get_user_tenant_id(auth.uid())`
- **Seed trigger**: On tenant creation, auto-insert the 7 default mappings (self_harm/high, unsafe/high, overwhelmed/moderate, anxiety/moderate, work_stress/moderate, other/moderate, talk/low)
- **Update** `map_intent_to_risk` function to query the table instead of using hardcoded CASE statement (with fallback to 'moderate')

### 2. UI: Upgrade `RulesTab.tsx`

Replace the static table with a dynamic CRUD interface:

- **Table view** with columns: Intent, Risk Level, Action, and an Actions column (Edit / Delete buttons)
- **"Add Rule" button** at the top-right of the card header
- **Edit row**: Clicking Edit opens a dialog/sheet with:
  - Intent field (text input for custom intents, or select from known intents)
  - Risk Level select (High / Moderate / Low)
  - Custom Action description (optional textarea)
- **Delete**: Soft-delete with confirmation dialog. Default/system rules show a warning that deletion may affect crisis routing.
- **Badge colors**: High = destructive (red), Moderate = secondary (amber), Low = default (green)
- Keep the existing high-risk warning banner at the bottom

### 3. Hook: `useRiskMappings.ts`

New hook in `src/hooks/crisis/` providing:
- `useRiskMappings()` -- fetch all active mappings for the tenant
- `useCreateRiskMapping()` -- insert a new mapping
- `useUpdateRiskMapping()` -- update intent/risk/action
- `useDeleteRiskMapping()` -- soft-delete (set `deleted_at`)

All using TanStack Query with proper cache invalidation.

### 4. Files to Create/Modify

| File | Action |
|------|--------|
| **Migration SQL** | Create `mh_risk_mappings` table, RLS, seed trigger, update `map_intent_to_risk` function |
| `src/hooks/crisis/useRiskMappings.ts` | **Create** -- CRUD hook |
| `src/components/crisis/RulesTab.tsx` | **Rewrite** -- dynamic table with add/edit/delete |
| `src/components/crisis/RiskMappingDialog.tsx` | **Create** -- form dialog for add/edit |

### 5. Technical Notes

- The seed trigger will be added to the existing tenant creation flow (similar to `seed_default_mood_definitions`)
- Existing tenants will need a one-time seed via migration (INSERT for each existing tenant)
- The `map_intent_to_risk` DB function will be updated to query the table with a fallback, ensuring crisis case creation still works
- Soft deletes (`deleted_at IS NULL` filter) follow project conventions
- All UI uses logical properties (`me-`, `ms-`, `text-start`) for RTL support
