
Fix the Risk Trend card at the chart level and the mobile card/container level, because the current issue is not fully solved by Y-axis padding alone.

### What to change

1. Fix Risk Trend chart overflow on mobile
- In `src/components/dashboard/RiskTrendChart.tsx`:
  - Increase chart top/bottom breathing room more aggressively for mobile.
  - Change the Y-axis from fixed `domain={[0, 100]}` to a safer auto/padded setup so the top point at `100%` and bottom point at `0%` do not touch the edges.
  - Reduce active dot size on small screens.
  - Add `allowDataOverflow={false}` and slightly larger chart margins.
  - Move or simplify the `ReferenceLine` label on mobile, because `insideTopRight` can visually collide with the chart edge.

2. Prevent card content from being clipped by parent wrappers
- In `src/features/org-dashboard/components/OverviewTab.tsx`:
  - Update `CollapsibleCard` so the hide/show button is always visible on mobile, not only on hover.
  - Ensure the wrapper around `RiskTrendChart` does not visually crop chart content when rendered inside the collapsible container.
  - Add a mobile-safe spacing rule around chart cards so headers/buttons do not overlap the chart area.

3. Match the same mobile-safe chart pattern used across analytics cards
- Re-check `CategoryHealthChart.tsx` and `AffectiveStateChart.tsx` for consistency, but prioritize `RiskTrendChart` since that is the remaining broken card.
- Keep all styles aligned with the existing design tokens and RTL-safe utilities.

### Likely root cause
The session replay shows the active dot still rendering very close to the top and bottom edges (`cy` near chart limits), which means the line itself is still reaching the container boundary. Also, the current card wrapper uses an absolutely positioned control that may overlap the chart area on mobile.

### Files to update
- `src/components/dashboard/RiskTrendChart.tsx`
- `src/features/org-dashboard/components/OverviewTab.tsx`

### Expected result
- Risk Trend line and dots are fully visible on mobile
- No top/bottom clipping at 0% or 100%
- No overlap between the hide button and chart content
- Card remains clean, premium, and responsive in Arabic and English
