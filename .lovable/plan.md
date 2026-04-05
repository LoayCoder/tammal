

## Add Entrance Animation to Engagement Rank Badge

### What to change

**File**: `src/components/dashboard/EngagementRankBadge.tsx`

Add a staggered entrance animation when the badge first renders:

1. **Card entrance**: Fade-in + slide-up using the existing `animate-fade-in` utility from the design system
2. **Medal/Trophy icon**: Scale-in with a slight bounce delay (CSS animation-delay)
3. **Rank number**: Counter-style pop with a slight delay after the icon
4. **Top-3 shimmer**: For top 3 ranks, add a subtle one-time shine sweep across the card using a CSS gradient keyframe

Implementation approach:
- Use the existing `animate-fade-in` class on the outer Card
- Add inline `style={{ animationDelay }}` for staggered children (icon at 150ms, rank number at 300ms, medal at 450ms)
- Each child gets `animate-scale-in` with `opacity-0` initial state and `animate-fill-forwards`
- For top-3, add a `@keyframes shimmer` that runs once — a diagonal gradient sweep across the card background

**File**: `tailwind.config.ts`

Add one new keyframe + animation:
- `badge-pop`: scale 0.8 → 1.05 → 1 with opacity, for the rank number pop effect
- `shimmer-once`: a single left-to-right shine sweep for top-3 cards

### Files to update

| File | Change |
|------|--------|
| `src/components/dashboard/EngagementRankBadge.tsx` | Add staggered entrance animations with delays |
| `tailwind.config.ts` | Add `badge-pop` and `shimmer-once` keyframes |

### Expected result
- Badge slides in smoothly when data loads
- Icon, rank number, and medal appear with staggered timing
- Top-3 ranks get a premium one-time shine effect
- No layout jumps; animation is subtle and premium

