

## Premium VIP Upgrade — Mood Dashboard

Two dashboards to upgrade: the standalone **MoodTrackerPage** (`/mental-toolkit/mood`) and the embedded **PersonalMoodDashboard** (on Employee Home).

### Changes

**1. `MoodTrackerPage.tsx` — Premium page layout**
- Increase section spacing to `space-y-5`
- Use `rounded-2xl` consistently
- Remove border-dashed from empty state

**2. `MoodStatCards.tsx` — Glass stat cards with hover**
- Replace `cardVariants.stat` with `premium-card` class
- Use `rounded-2xl`, add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Remove colored icon backgrounds — use outline Lucide icons with toolkit colors directly
- Increase padding to `p-5`

**3. `MoodTrendChart.tsx` — Premium chart**
- Replace card with `premium-card rounded-2xl`
- Increase chart height from `h-56` to `h-64`
- Increase stroke width to 2.5, gradient opacity to 0.45
- Active dot: add glow ring effect (stroke: card color, strokeWidth: 3, r: 6)
- Tooltip: add `shadow-lg` and `backdrop-blur` class styling
- Soften grid reference line opacity

**4. `MoodDistributionDonut.tsx` — Soft donut**
- Use `premium-card rounded-2xl`
- Increase donut size (innerRadius: 45, outerRadius: 75)
- Add paddingAngle: 4 for cleaner segment gaps
- Use semantic toolkit colors from DONUT_COLORS (already good)

**5. `MoodHeatmap.tsx` — Glowing activity pills**
- Use `premium-card rounded-2xl`
- Replace square cells with `rounded-xl` pill shape
- Dynamic color: Low → `hsl(var(--muted)/0.3)`, Medium → `hsl(var(--primary)/0.25)`, High → `hsl(var(--primary)/0.55)`
- Add subtle `transition-colors duration-200` on cells

**6. `MoodToolsSuggestions.tsx` — Glass metric cards**
- Use `premium-card rounded-2xl` for all three cards
- Add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- Increase padding to `p-5`
- Style links as subtle buttons with `hover:opacity-80`

**7. `PersonalMoodDashboard.tsx` — Embedded widget refinement**
- Already using `premiumVip` — keep as-is, minor polish:
  - Weekly activity cells: use `rounded-xl` instead of `rounded-lg`
  - Increase cell transition smoothness

### Design Principles Applied
- All hardcoded colors replaced with toolkit semantic tokens (already mostly done)
- `rounded-2xl` everywhere, `premium-card` class for glass effect
- Subtle hover animations (150-200ms, -translate-y-0.5, shadow-md)
- Calm color palette maintained (lavender, sage, sky)
- Increased whitespace and breathing room
- No heavy backgrounds or harsh borders

### Files Modified
| File | Change |
|------|--------|
| `src/pages/mental-toolkit/MoodTrackerPage.tsx` | Spacing, rounded-2xl |
| `src/components/mental-toolkit/mood/MoodStatCards.tsx` | Premium cards, hover effects |
| `src/components/mental-toolkit/mood/MoodTrendChart.tsx` | Premium chart, glow dots, better tooltip |
| `src/components/mental-toolkit/mood/MoodDistributionDonut.tsx` | Premium card, larger donut |
| `src/components/mental-toolkit/mood/MoodHeatmap.tsx` | Glowing pills, dynamic colors |
| `src/components/mental-toolkit/mood/MoodToolsSuggestions.tsx` | Premium cards, hover effects |
| `src/components/dashboard/PersonalMoodDashboard.tsx` | Minor cell shape polish |

