

# Embed Strategic Hierarchy Management in Representative Page

## What the user wants
The representative should manage the entire strategic hierarchy (Objectives → Initiatives → Actions) directly from `/admin/workload/representative` — not by navigating to `/admin/workload/objectives`. Anything created here is shared data (same tables), so it automatically appears in manager/admin views.

## Approach

### Restructure `RepresentativeWorkload.tsx` with Tabs

Add a `Tabs` component with two tabs:
1. **Strategic Objectives** — Full hierarchy management (create/edit/delete objectives, drill into initiatives and actions) embedded inline
2. **Task Distribution** — The existing batch distribution, bulk import, and template download functionality

### Strategic Objectives Tab (New Section)

Embed a condensed version of the `ObjectivesManagement` + `ObjectiveDetail` pattern directly in the representative page:

- **Objectives list** with cards (reuse existing card pattern from `ObjectivesManagement`)
- Clicking an objective expands it inline (accordion-style) to show its **Initiatives**
- Expanding an initiative shows its **Actions** table
- Full CRUD at each level using existing dialogs: `ObjectiveDialog`, `InitiativeDialog`, `ActionDialog`
- Lock/unlock controls at each level
- All using the same hooks (`useObjectives`, `useInitiatives`, `useActions`) — same database tables, so changes are instantly visible to managers

### Files to modify
- **`src/pages/admin/RepresentativeWorkload.tsx`** — Add Tabs layout, embed strategic hierarchy management in the first tab, move existing distribution UI to second tab

### No new components needed
All dialogs (`ObjectiveDialog`, `InitiativeDialog`, `ActionDialog`) and hooks already exist with Owner/Accountable/Division/Department fields. We just need to compose them into the representative page.

### No database changes
Same `strategic_objectives`, `initiatives`, `objective_actions` tables. Existing `sync_action_to_queue` trigger handles auto-sync to dashboards.

