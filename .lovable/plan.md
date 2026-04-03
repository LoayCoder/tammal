

# Premium Segmented Control Tabs

Upgrade the base `tabs.tsx` component defaults and the `glass-tabs` CSS class so all tabs across the app get a premium segmented-control feel without touching every consumer file.

## Changes

### 1. `src/index.css` — Upgrade `.glass-tabs` and add `.glass-active`

Replace the current `.glass-tabs` block with a premium segmented style:
- Container: `bg-muted/50` (subtle tinted background), `rounded-xl`, `p-1`, no border
- Add `.glass-active` class for active pill: `bg-card`, `shadow-[0_1px_3px_rgba(0,0,0,0.08)]`, `text-foreground`
- Dark mode: slightly lighter muted bg for container, darker card for active
- Add `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` on triggers for smooth switching

### 2. `src/components/ui/tabs.tsx` — Upgrade base defaults

Update `TabsList` default classes:
- From: `rounded-md bg-muted p-1`
- To: `rounded-xl bg-muted/50 p-1 border-0`

Update `TabsTrigger` default classes:
- From: `rounded-sm` with `data-[state=active]:bg-background`
- To: `rounded-lg` with `data-[state=active]:bg-card data-[state=active]:shadow-[0_1px_3px_rgba(0,0,0,0.08)] data-[state=active]:text-foreground transition-all duration-200`
- Inactive: `text-muted-foreground`

### 3. `src/pages/Dashboard.tsx` — Simplify inline classes

Remove redundant inline classes on TabsList/TabsTrigger since the base component now handles the premium style. Keep only `w-full`, `h-auto`, `flex-1`, and responsive size classes (`text-xs sm:text-sm`, `px-2 py-1.5 sm:px-4 sm:py-2`).

### 4. `src/components/dashboard/OrgDashboard.tsx` — Simplify

Same simplification — remove redundant styling, rely on base + `glass-tabs` class.

### 5. `src/pages/admin/PortfolioDashboard.tsx` — Simplify

Remove `rounded-full` overrides, use consistent `rounded-xl` from base.

## Files

| File | Change |
|------|--------|
| `src/index.css` | Premium `.glass-tabs` / `.glass-active` styles |
| `src/components/ui/tabs.tsx` | Upgrade base defaults to segmented control |
| `src/pages/Dashboard.tsx` | Simplify inline tab classes |
| `src/components/dashboard/OrgDashboard.tsx` | Simplify inline tab classes |
| `src/pages/admin/PortfolioDashboard.tsx` | Simplify inline tab classes |

