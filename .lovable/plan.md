

## Redesign Personal Mood Dashboard — Premium VIP Analytics Panel

### Overview
Transform the `PersonalMoodDashboard` from fragmented boxed cards into a unified, data-focused analytics panel with strong hierarchy, dominant chart, and minimal noise.

### Current State
- 4 separate KPI cards in a 2x2 grid (Current Streak, 7-Day Average, Monthly Check-ins, Today's Mood)
- Mood Trend chart in its own card
- Distribution donut + Weekly Activity heatmap in 2-col grid
- Survey Stats card
- Reframe Activity + Breathing Activity cards

### Changes (single file: `src/components/dashboard/PersonalMoodDashboard.tsx`)

**1. Unified Metrics Row — Replace 4 boxed KPI cards**
- Remove the 4 separate `Card` containers with colored icon backgrounds
- Replace with a single horizontal flex row (no card wrapper)
- Each metric: large number (`text-xl font-bold`) + small muted label (`text-[10px]`)
- Separate with subtle vertical dividers (`border-e border-border/40`)
- Optional subtle icon (`h-3.5 w-3.5 strokeWidth 1.5`)
- Today's Mood shows emoji inline instead of a card

**2. Chart Area — Make it the dominant visual element**
- Remove card wrapper around the Mood Trend chart — render it directly
- Increase chart height from `h-56` to `h-64`
- Soften grid lines: use very subtle stroke color
- Reduce dot radius from 3 to 2 for gentler data points
- Keep smooth monotone line with soft gradient fill
- Move legend below chart with minimal styling
- Add more vertical spacing above/below chart (`py-4`)

**3. Distribution + Activity — Compact inline section**
- Remove separate card containers
- Render donut chart and weekly activity side-by-side in a clean row
- Reduce visual weight — smaller donut (innerRadius 35, outerRadius 55)
- Activity heatmap: softer colors, smaller cells

**4. Survey / Reframe / Breathing Stats — Minimal stat rows**
- Collapse 3 separate cards into compact stat groups
- Use the same horizontal divider pattern as the metrics row
- Remove card wrappers, use `border-b border-border/20` between sections
- Remove navigation links (Open Thought Reframer, Go to Breathing) — keep data only

**5. Spacing & Hierarchy**
- Increase `space-y-4` to `space-y-6` for more breathing room
- Section labels: `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Numbers always dominant, labels always secondary

**6. Visual Style**
- Use `premiumVip` card variant for the outer wrapper only
- No nested card containers
- Clean background with whitespace separation
- Calm, consistent colors (toolkit-lavender for primary line, toolkit-sage for secondary)

### Visual Result

```text
┌─────────────────────────────────────┐
│  🔥 0   │  📈 5    │  📅 0/30 │ 😐  │
│  Streak │  Avg 7d  │  Checkins│Today│
│                                     │
│  ── Mood Trend (14 Days) ────────  │
│                                     │
│     5 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│     4                    ·          │
│     3 ─ ─ ─ ─ ─ · ─ ─ ─ ─ ─ ─    │
│     2                               │
│     1                               │
│       01  03  05  07  09  11  13    │
│       ── You  - - Org Average       │
│                                     │
│  [Donut]        [Weekly Activity]   │
│                                     │
│  25 Answered │ 2.8 Avg │ 100% Rate │
│  0 Reframes  │ 0 /mo   │ 0d streak │
│  0 Sessions  │ 0 /mo   │ 0d streak │
└─────────────────────────────────────┘
```

### Files Modified
- `src/components/dashboard/PersonalMoodDashboard.tsx` — full visual redesign, no logic changes

