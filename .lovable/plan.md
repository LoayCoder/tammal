

# UI Modernization — Linear/Notion Style Refresh

**Goal**: Transform TAMMAL from a generic SaaS look into a clean, minimal Linear/Notion-inspired design. Focused on sidebar, cards/dashboards, and colors/typography.

---

## What Changes

### Phase 1: Color & Typography Refresh (src/index.css + tailwind.config.ts)

**Light mode** — shift from gray (#F2F2F2) background to a cooler, near-white tone:
- `--background`: `0 0% 95%` → `220 14% 97%` (subtle cool tint like Linear)
- `--card`: keep `0 0% 100%`
- `--border`: `0 0% 89%` → `220 13% 91%` (cooler, thinner feel)
- `--muted-foreground`: `0 0% 46%` → `220 9% 46%` (cooler gray text)
- `--foreground`: `0 0% 19%` → `220 14% 10%` (near-black, crisper)
- `--radius`: `0.5rem` → `0.625rem` (10px — slightly rounder, more modern)

**Dark mode** — similar cool-tone shift:
- `--background`: `0 0% 10%` → `220 14% 8%`
- `--card`: `0 0% 14%` → `220 14% 11%`
- `--border`: `0 0% 22%` → `220 13% 18%`

**Shadows** — make them subtler and cooler:
- Reduce all shadow opacity by ~30%
- Add a blue-ish tint: `hsl(220 40% 50% / 0.04)` instead of pure gray

**Typography tokens** (src/theme/tokens.ts):
- `pageTitle`: `text-2xl` → `text-xl` (Linear uses smaller, tighter headings)
- Add `tracking-tight` to pageTitle and sectionTitle
- `statLabel`: keep `text-xs font-bold` but add `uppercase tracking-wide` for that clean label look

### Phase 2: Sidebar Modernization (AppSidebar.tsx + index.css)

Current sidebar has dot bullets, vertical connector lines, and rounded-xl items — this reads as busy. Linear/Notion sidebars are quieter.

Changes:
- **Remove** dot bullet indicators (`h-2.5 w-2.5 rounded-full`) from sub-items — replace with just the text, left-aligned
- **Remove** vertical connector lines (`w-px bg-muted-foreground/20`)
- **Active state**: instead of blue tint background, use a subtle `font-medium` + left border accent (2px solid primary on the start edge)
- **Hover state**: softer — `bg-muted/50` instead of dedicated hover-bg variable
- **Group triggers**: remove the active dot indicator (`h-1.5 w-1.5 rounded-full`)
- **Reduce item height**: `h-10` → `h-9` for groups, `h-9` → `h-8` for sub-items (tighter spacing)
- **Sidebar footer border**: `border-t` → keep but make thinner via `border-border/50`
- **Sub-item indentation**: keep `ms-7` but cleaner without connector lines

### Phase 3: Cards & Dashboard Components

**glass-card / glass-stat classes** (index.css):
- Remove `box-shadow` from default cards — use border-only like Linear
- Add shadow only on hover for stat cards (already partially done)
- Reduce stat card hover lift: `translateY(-2px)` → `translateY(-1px)`

**MetricCard** (src/components/system/MetricCard.tsx):
- Remove `CardHeader` / `CardContent` wrapper padding differences — use a single flat `p-4` layout
- Icon position: move from top-right to inline with value (cleaner)

**StatCard** (src/components/system/StatCard.tsx):
- Keep icon-box but reduce from colored background to simple icon (remove `bg-primary/10`)

**PageHeader** (src/components/system/PageHeader.tsx):
- Flush variant: remove glass background entirely — just render title/subtitle on the page background with bottom border
- Remove icon-box background color — show icon bare

### Phase 4: Header Simplification (Header.tsx)

- Remove `glass-header` background — use transparent with only a bottom border
- This creates the "floating content" feel that Linear has

### Phase 5: Main Layout Background (MainLayout.tsx)

- **Remove** all 4 decorative gradient blobs — these are the biggest "old app" signal
- Clean, solid background color only

---

## Files Modified

| File | Change |
|---|---|
| `src/index.css` | Color variables, shadow values, glass-card/glass-stat/glass-header classes |
| `src/theme/tokens.ts` | Typography token adjustments (tracking, sizing) |
| `tailwind.config.ts` | Updated radius value |
| `src/components/layout/MainLayout.tsx` | Remove gradient blobs |
| `src/components/layout/AppSidebar.tsx` | Remove dots, lines, simplify active/hover states |
| `src/components/layout/Header.tsx` | Transparent header with border-only |
| `src/components/system/PageHeader.tsx` | Lighter flush variant |
| `src/components/system/MetricCard.tsx` | Flat layout, no icon background |
| `src/components/system/StatCard.tsx` | Remove icon background tint |

## What Stays the Same

- All component logic, data flow, routing, RBAC
- RTL support (all changes use logical properties)
- Branding injection system (CSS variables still used)
- Dark mode support (both themes updated in parallel)
- Shadcn component library usage

## Result

A cleaner, quieter, more professional UI that feels like Linear or Notion — minimal, well-spaced, with confident typography and no visual clutter.

