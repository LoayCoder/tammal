

# Elevate Mood Tracker Page — Premium Executive Analytics

## Current State
The page works but feels flat: generic card containers, small heatmap cells, basic donut, and the three tool stat sections (Survey, Reframe, Breathing) are separate stacked cards creating visual noise. The screenshot confirms a functional but unremarkable layout.

## Design Upgrades

### 1. Stat Cards — Glassmorphic with accent borders
**File:** `MoodStatCards.tsx`
- Add a left (or start) accent border colored per-stat (streak=lavender, avg=zone-color, checkins=sage, today=sky)
- Use `premium-card-vip` variant with subtle gradient background
- Larger emoji for today's mood (text-4xl), bolder metric values
- Add a micro progress ring for monthly check-ins (visual % complete)

### 2. Mood Trend Chart — Richer, taller, glow dots
**File:** `MoodTrendChart.tsx`
- Increase height from h-64 to h-72
- Add a subtle gradient background inside the card
- Use custom active dot with soft glow/shadow effect
- Add a "midline" label at score 3 ("Neutral") for context
- Improve tooltip with rounded-2xl, more padding, subtle emoji size bump

### 3. Donut Chart — Centered label + better proportions
**File:** `MoodDistributionDonut.tsx`
- Add a center label showing total check-ins count inside the donut hole
- Increase inner/outer radius for a bolder ring
- Use custom legend with colored dots instead of default Recharts legend
- Match card height to heatmap card for visual alignment

### 4. Weekly Activity Heatmap — Pill upgrade
**File:** `MoodHeatmap.tsx`
- Increase cell size from w-8 h-8 to w-10 h-10
- Use rounded-full pills instead of rounded-xl for a cleaner look
- Add subtle ring/border on active days
- Show day abbreviations bolder with proper spacing
- Add a max indicator (highlight the busiest day with a subtle ring)

### 5. Tools Suggestions — Unified single card with dividers
**File:** `MoodToolsSuggestions.tsx`
- Merge the three separate cards (Survey, Reframe, Breathing) into **one premium card** with internal sections separated by subtle horizontal dividers
- Each section: icon + title on left, 3 stats in a horizontal row
- Remove redundant card chrome (3 cards → 1 card with 3 sections)
- Keep the CTA links but make them more subtle (text buttons)

### 6. Page Layout Polish
**File:** `MoodTrackerPage.tsx`
- Increase spacing from space-y-5 to space-y-6
- Add a subtle section label "ANALYTICS" above the trend chart area
- Add a section label "ACTIVITY" above tools suggestions

## Files to Change
1. `src/components/mental-toolkit/mood/MoodStatCards.tsx` — Accent borders, VIP styling, progress ring
2. `src/components/mental-toolkit/mood/MoodTrendChart.tsx` — Taller, glow dots, midline label
3. `src/components/mental-toolkit/mood/MoodDistributionDonut.tsx` — Center label, custom legend, bigger ring
4. `src/components/mental-toolkit/mood/MoodHeatmap.tsx` — Larger pills, max-day highlight
5. `src/components/mental-toolkit/mood/MoodToolsSuggestions.tsx` — Merge 3 cards into 1 with dividers
6. `src/pages/mental-toolkit/MoodTrackerPage.tsx` — Spacing and section labels

