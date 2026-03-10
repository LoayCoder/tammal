

## Full Design System Replacement: Current → Orbitask

### Scope

Replace the glassmorphism design system with the clean flat Orbitask SaaS look across the entire codebase. Preserve dark mode with a matching dark palette.

### Strategy

The key insight: redefine `.glass-card`, `.glass-stat`, `.glass-sidebar`, `.glass-header`, `.glass-tabs`, `.glass-chart` CSS classes in `index.css` to use **solid white backgrounds + Orbitask shadows** instead of blur/transparency. This automatically updates **121 files** without touching them individually.

### Changes by File

**1. `src/index.css`** — Central design system overhaul
- Replace Google Fonts import: Roboto → Inter (weights 400, 600, 700)
- Replace all CSS variable values with Orbitask HSL equivalents:

```text
Light theme:
  --background:    0 0% 95%        (#F2F2F2)
  --foreground:    0 0% 19%        (#303030)
  --card:          0 0% 100%       (#FFFFFF)
  --card-fg:       0 0% 19%        (#303030)
  --primary:       220 89% 56%     (#2A6FF3)
  --primary-fg:    0 0% 100%       (#FFFFFF)
  --secondary:     0 0% 28%        (#474747)
  --secondary-fg:  0 0% 100%       (#FFFFFF)
  --muted:         0 0% 57%        (#919191)
  --muted-fg:      0 0% 46%        (#757575)
  --destructive:   4 90% 58%       (#F44336)
  --border:        0 0% 89%        (#E4E4E4)
  --input:         0 0% 89%        (#E4E4E4)
  --ring:          220 89% 56%     (#2A6FF3)
  --radius:        0.5rem          (8px)
  --accent:        187 100% 42%    (#00BCD4 teal)
  
  + New status variables:
  --status-success-bg: 120 78% 96%
  --status-info-bg:    222 82% 96%
  --status-warning-bg: 37 100% 97%
  --status-error-bg:   349 100% 95%
  --success:           122 39% 49%  (#4CAF50)
  --warning:           36 100% 50%  (#FF9800)
```

- Dark theme: Create complementary dark Orbitask palette (dark neutrals, same accent hues at adjusted lightness)
- Redefine all `.glass-*` classes to **flat solid style**:
  - `.glass-card` → `background: hsl(var(--card)); border: 1px solid hsl(var(--border)); box-shadow: 2px 2px 7px rgba(65,74,83,0.08); border-radius: 0.5rem;` (no blur, no transparency)
  - `.glass-stat` → Same but with hover lift effect preserved
  - `.glass-sidebar` → Solid sidebar background, 1px border
  - `.glass-header` → Solid background, bottom border
  - `.glass-tabs` → Subtle background tint, no blur
  - `.glass-chart` → Same as glass-card
  - `.glass-active` → Primary tinted background, no glow
- Update shadow variables to Orbitask values
- Update font variables to Inter

**2. `tailwind.config.ts`**
- Font family: `Inter` replaces `Roboto` as primary sans
- Add status color tokens: `success`, `warning`, `info` with bg variants
- Radius stays at `var(--radius)` (now 8px via CSS variable)

**3. `src/theme/tokens.ts`**
- Card variants: `rounded-2xl` → `rounded-lg` (all 4 variants)
- Icon boxes: `rounded-xl` / `rounded-2xl` → `rounded-lg`

**4. Bulk `rounded-2xl` → `rounded-lg`** across 35 component files
- Automated search-and-replace in all `.tsx` files
- This covers skeletons, inline card styling, toolkit components, etc.

**5. `src/components/mental-toolkit/shared/ToolkitCard.tsx`**
- Update variant classes: `rounded-2xl` → `rounded-lg`

**6. `src/components/system/PageHeader.tsx`**
- Already uses tokens, will inherit changes

**7. `src/components/system/StatCard.tsx`, `ChartCard.tsx`**
- Already use `cardVariants` from tokens, will inherit

### Files NOT changed
- 121 files using `glass-card` / `glass-stat` class names — automatically updated via CSS redefinition
- `ComponentShowcase.tsx` — dev tool, will reflect new system automatically
- UI primitives (`button.tsx`, `card.tsx`) — already use CSS variables, will inherit

### Dark Mode Palette (new)

```text
  --background:    0 0% 10%
  --foreground:    0 0% 95%
  --card:          0 0% 14%
  --primary:       220 89% 62%
  --border:        0 0% 22%
  --muted-fg:      0 0% 60%
  (all other tokens follow same hue, adjusted lightness)
```

### Implementation Order
1. `index.css` — colors, fonts, glass redefinition, shadows
2. `tailwind.config.ts` — font, status colors
3. `tokens.ts` + `ToolkitCard.tsx` — border radius updates
4. Batch `rounded-2xl` → `rounded-lg` across 35 files

### Risk
- Mental Toolkit palette (`--toolkit-*`) is preserved as-is (domain-specific, not part of Orbitask system)
- Chart colors updated to use Orbitask blue/teal/orange
- No behavioral changes, no new dependencies

