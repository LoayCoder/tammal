

## Full UI Redesign -- Glassmorphism Premium Theme

### Scope (Phase 1)
This plan covers the pages you specified:
1. **Sidebar navigation** -- glassmorphism container, pill-style items, blue glow active states
2. **Overview page** (DashboardOverviewTab + SaasStatsSection) -- glass cards, premium KPI stats
3. **Organization Wellness** (OrgDashboard) -- glass cards, refined charts, executive summary
4. **My Dashboard** (EmployeeHome) -- already uses glass-card, will be enhanced further

---

### 1. Design System Foundation (CSS Variables + Utilities)

Update `src/index.css` to establish the glassmorphism design tokens:

- **Dark mode background**: Deep navy (`222 47% 8%`) instead of current dark shade -- feels premium, not harsh
- **Increase border-radius**: `--radius: 0.75rem` (12px base, cards get 16-20px via classes)
- **New CSS utility classes**:
  - `.glass-sidebar` -- sidebar-specific frosted glass with deep navy tint
  - `.glass-stat` -- stat card variant with subtle inner glow and hover lift
  - `.glass-chart` -- chart container with slightly more opacity for readability
  - `.glass-active` -- active nav item with blue glow ring
- **Enhance existing** `.glass-card` and `.glass` classes with softer shadows, more refined blur
- **Chart tooltip class** `.glass-tooltip` -- frosted tooltip matching reference images
- **Background gradient blobs** -- subtle animated gradient blobs for depth (already in EmployeeHome, will standardize)

### 2. Sidebar Redesign (`AppSidebar.tsx` + `sidebar.tsx`)

**Visual changes:**
- Sidebar container gets `glass-sidebar` treatment: semi-transparent background with backdrop blur
- Menu items become **pill-shaped** with rounded-full corners
- Active state: soft blue glow ring (`ring-2 ring-primary/30 bg-primary/10`) instead of flat accent background
- Hover: subtle scale + opacity transition (`transition-all duration-200 hover:bg-sidebar-accent/50`)
- Group labels: slightly larger, uppercase tracking, with thin separator line
- Collapsed state: icon-only with tooltip, maintaining glass effect
- Header branding area: glass divider, subtle bottom border glow

**Technical changes in `sidebar.tsx`:**
- Update `sidebarMenuButtonVariants` to use rounded-xl and glass hover states
- Update the sidebar container div to apply glass background classes
- Ensure the mobile Sheet variant inherits the glass styling

**Technical changes in `AppSidebar.tsx`:**
- Update `SidebarHeader` classes for glass styling
- Update `NavLink` `activeClassName` to use the new glow-based active state
- Add hover transition classes to all menu buttons
- Update group label styling (uppercase, tracking-wider, opacity)

### 3. Header Redesign (`Header.tsx`)

- Apply stronger glassmorphism: `bg-background/40 backdrop-blur-xl` 
- Add subtle bottom border glow: `border-b border-white/10 dark:border-white/5`
- Action icons (notifications, theme, language, user) get glass-badge hover states

### 4. Main Layout (`MainLayout.tsx`)

- Add decorative gradient blobs to the main content area (similar to EmployeeHome pattern) so all pages benefit from the glass depth effect
- These will be positioned absolutely, behind content, with `pointer-events-none`

### 5. Dashboard Overview Tab (`DashboardOverviewTab.tsx` + `SaasStatsSection.tsx`)

**SaasStatsSection:**
- KPI stat cards: `glass-stat` class with hover lift animation, subtle inner glow
- Icon gets a rounded glass background container instead of bare icon
- Values get larger font weight, slight gradient text effect in dark mode
- Pie charts: glass container, softer color palette, rounded legend items
- Add background gradient blobs for visual depth

**DashboardOverviewTab:**
- Activity card gets glass-card treatment
- Section header gets decorative accent line

### 6. Organization Wellness Dashboard (`OrgDashboard.tsx` + sub-components)

**OrgDashboard:**
- KPI cards grid: convert to `glass-stat` cards with icon containers
- TabsList: glass-pill style with backdrop blur
- All Card wrappers: `glass-card border-0`
- Add gradient blobs behind content

**ExecutiveSummary:**
- Health gauge card: enhanced glass styling with inner glow border
- Period comparison and alerts sections: glass sub-containers

**Chart components** (CategoryHealthChart, RiskTrendChart, AffectiveStateChart, etc.):
- All chart Cards: `glass-chart` class
- Tooltip styles: glass-tooltip (frosted, rounded-xl, shadow-lg)
- Bar charts: rounded bar edges (already using radius, increase to `[8, 8, 0, 0]`)
- Add dashed average reference lines where appropriate
- Softer grid lines (`stroke-opacity: 0.15`)
- Active data point: glow effect via larger activeDot with opacity ring

**EarlyWarningPanel:**
- Warning items: glass sub-cards instead of flat border
- Severity badges: glass-badge variant

### 7. Employee Home / My Dashboard (`EmployeeHome.tsx`)

This page already uses `glass-card` and gradient blobs. Enhancements:
- Stat cards: upgrade to `glass-stat` with hover lift
- Mood chart tooltip: `glass-tooltip` style
- Burnout indicator: glass progress track with glow on the fill bar
- Gamification badges: enhanced `glass-badge` with subtle shimmer
- Check-in and survey action cards: add hover glow transition

### 8. Dashboard Tab Switcher (`Dashboard.tsx`)

- TabsList: frosted glass pill container with backdrop blur
- TabsTrigger: rounded-full, glass hover, active glow ring

---

### Technical Details

| File | Changes |
|---|---|
| `src/index.css` | New CSS variables (navy dark bg, larger radius), enhanced glass utility classes, glass-sidebar/glass-stat/glass-chart/glass-tooltip/glass-active utilities |
| `tailwind.config.ts` | Add `backdrop-blur` utility extensions if needed, animation keyframes for subtle hover lift |
| `src/components/ui/sidebar.tsx` | Update sidebar container classes, menu button variants for pill shape + glass hover |
| `src/components/layout/AppSidebar.tsx` | Glass sidebar styling, pill nav items, glow active states, refined group labels |
| `src/components/layout/Header.tsx` | Glass header with blur, glow border |
| `src/components/layout/MainLayout.tsx` | Add decorative gradient blobs to main content area |
| `src/pages/Dashboard.tsx` | Glass TabsList styling |
| `src/pages/EmployeeHome.tsx` | Enhanced glass-stat cards, glass-tooltip, burnout glow |
| `src/components/dashboard/DashboardOverviewTab.tsx` | Glass card wrappers |
| `src/components/dashboard/SaasStatsSection.tsx` | Glass stat cards with icon containers, gradient blobs |
| `src/components/dashboard/OrgDashboard.tsx` | Glass KPI cards, glass tabs, gradient blobs, all cards to glass-card |
| `src/components/dashboard/ExecutiveSummary.tsx` | Glass card with glow border |
| `src/components/dashboard/CategoryHealthChart.tsx` | Glass-chart, glass-tooltip, rounded bars |
| `src/components/dashboard/RiskTrendChart.tsx` | Glass-chart, glass-tooltip, softer grid |
| `src/components/dashboard/AffectiveStateChart.tsx` | Glass-chart styling |
| `src/components/dashboard/EarlyWarningPanel.tsx` | Glass warning items |
| `src/components/dashboard/TopEngagersCard.tsx` | Glass-card |
| `src/components/dashboard/AIInsightsCard.tsx` | Glass-card |
| `src/components/dashboard/CheckinMoodOverTime.tsx` | Glass-chart |
| `src/components/dashboard/SupportActionsChart.tsx` | Glass-chart |
| `src/components/dashboard/StreakDistribution.tsx` | Glass-chart |
| `src/components/dashboard/CheckinByOrgUnit.tsx` | Glass-chart |
| `src/components/dashboard/OrgComparisonChart.tsx` | Glass-chart |
| `src/components/dashboard/ResponseHeatmap.tsx` | Glass-chart |
| `src/components/dashboard/TimeRangeSelector.tsx` | Glass select styling |
| `src/components/dashboard/comparison/*.tsx` | Glass-card treatment for all comparison cards |

### Color Psychology Alignment

- **Blue/teal** for positive metrics and primary actions (calming, trustworthy)
- **Soft green** for improvements and success states
- **Amber/orange** for caution warnings (not harsh yellow)
- **Muted rose** for risk indicators (not aggressive red unless critical)
- All harsh neon colors avoided; palette stays muted and professional

### Performance Considerations

- Backdrop blur limited to key containers (sidebar, header, cards) -- not applied to every element
- Gradient blobs use CSS `blur-3xl` which is GPU-accelerated
- No additional JS overhead -- all styling is CSS-only
- Glass effects degrade gracefully on older browsers via `@supports`

### RTL Compliance

- All new classes use logical properties (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, `text-end`)
- No directional CSS (`ml-`, `mr-`, `left-`, `right-`)
- Icon chevrons maintain `rtl:-scale-x-100` behavior

