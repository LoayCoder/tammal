

## Phase 6 — Premium VIP UX & Design System Integration

### Assessment

The Team Pulse components already use `cardVariants.premiumVip`, semantic colors (`chart-1`, `chart-4`, `destructive`), and `strokeWidth={1.5}` consistently. However, several components have design system gaps that reduce the premium feel.

### Identified Issues

| Component | Issue |
|-----------|-------|
| `PulseInsightBlock` | No section label; score lacks a visual gauge; `impactReason` italic style feels weak |
| `PulseTargetBlock` | Uses raw `bg-muted/5` instead of a token-derived surface; no subtle animation on progress bar |
| `PulseActionPath` | CTA button uses inline gradient classes instead of a reusable premium CTA pattern; `recommendedAction` text has no section header |
| `PulseNudgeCard` | Link-style CTA at bottom feels weak — should be a contained button matching premium style |
| `PulseModeSwitcher` | Functional but uses raw `bg-muted/10` — needs premium-badge surface for active tab |
| `TeamPulseCard` | Team Kudos Nudge button uses raw inline classes; overall section dividers missing between content blocks |
| `AppreciationActivityWidget` | Category label translation uses brittle string concatenation that will break for some categories |
| `PulseSkeleton` | Missing shimmer effect — uses plain `animate-pulse` without premium surface |
| General | No entrance animations; no visual separators between insight/target/action blocks |

### Plan

#### 1. Add Engagement Score Gauge to `PulseInsightBlock`

Replace the plain `text-3xl` score with a compact semi-circle gauge (SVG arc, ~64px) using semantic score colors. Add a `typography.statLabel` section header ("Engagement Score"). Move `impactReason` from italic to a bordered callout with a subtle `Sparkles` icon.

#### 2. Elevate `PulseTargetBlock`

- Replace `bg-muted/5` with `premium-badge` surface class
- Add `transition-all duration-700 ease-out` to the progress bar fill for smooth entrance
- Use `typography.statLabel` for the target label
- Add a percentage badge next to the progress bar

#### 3. Refine `PulseActionPath`

- Add a `typography.statLabel` section header ("Recommended Action")
- Replace inline gradient classes with a reusable premium CTA style using `primary` tokens
- Add subtle `hover:-translate-y-0.5` lift effect
- Use `useNavigate` from react-router instead of `window.location.href`

#### 4. Upgrade `PulseNudgeCard`

- Replace the link-style CTA with a contained outline button matching the severity color
- Add `rounded-xl` container with `premium-card` surface instead of raw color/opacity classes
- Add entrance animation via `animate-in fade-in slide-in-from-bottom-2`

#### 5. Polish `PulseModeSwitcher`

- Active tab: use `premium-badge` class for the selected state instead of raw `bg-primary/10`
- Add `transition-all duration-200` for smoother tab transitions

#### 6. Refine `TeamPulseCard` Layout

- Add thin separator lines (`border-t border-border/10`) between insight, target, and action blocks
- Extract kudos nudge button to match the same premium CTA pattern as `PulseActionPath`
- Add staggered entrance animations (`animate-in` with increasing delays) to child blocks

#### 7. Fix `AppreciationActivityWidget` Category Labels

- Replace brittle string manipulation with a clean `CATEGORY_LABEL_KEYS` map for translation keys
- Ensure RTL `text-end` is used consistently (already present)

#### 8. Upgrade `PulseSkeleton`

- Use `premium-card` surface behind skeleton elements for visual consistency with loaded state

### Files Summary

| File | Change |
|------|--------|
| `src/features/team-pulse/components/PulseInsightBlock.tsx` | Score gauge, section label, impactReason callout |
| `src/features/team-pulse/components/PulseTargetBlock.tsx` | Premium surface, animated progress, percentage badge |
| `src/features/team-pulse/components/PulseActionPath.tsx` | Section header, premium CTA, useNavigate |
| `src/features/team-pulse/components/PulseNudgeCard.tsx` | Contained button, premium surface, entrance animation |
| `src/features/team-pulse/components/PulseModeSwitcher.tsx` | Premium-badge active state |
| `src/features/team-pulse/components/TeamPulseCard.tsx` | Separators, staggered entrance, refined kudos button |
| `src/features/team-pulse/components/AppreciationActivityWidget.tsx` | Clean category label map |
| `src/features/team-pulse/components/PulseSkeleton.tsx` | Premium surface |

### What Is Not Changing

- No new tables or migrations
- No edge function changes
- No new dependencies
- All changes are purely visual/UX refinements using existing design tokens

