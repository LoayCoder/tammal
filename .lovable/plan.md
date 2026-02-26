

## Redesign Employee Home to Match Balady-Style Grid Layout

### Design Analysis (from screenshot)
The Balady app uses:
- A **hero banner card** at the top with a call-to-action
- A **horizontally scrollable row** of icon cards ("Most Used") with rounded icon containers and Arabic labels below
- **2-column grid of category cards** -- each card shows 4 icon slots (2x2) with a "+N" count badge and a category label below
- Clean white/light gray background, rounded corners, minimal borders
- Bottom navigation bar (already implemented)

### Translation to Tammal Employee Home

**Section 1 -- Hero Banner**: The daily check-in card (or completed status) becomes a full-width gradient banner similar to Balady's top card.

**Section 2 -- "Quick Access" Scrollable Row**: Gamification badges + quick stats become horizontally scrollable icon cards (Check-in, Survey, Mood, Streak, Crisis Support, First Aider) with rounded icon containers and labels below.

**Section 3 -- "Services" 2-Column Grid**: Group features into category cards (Wellness Tools, Support Services) using the Balady 2x2 icon grid pattern with a count badge.

**Section 4 -- Mood Chart & Burnout**: Keep these as full-width cards below the grid, maintaining existing functionality.

### Files to Modify

| File | Action |
|------|--------|
| `src/pages/EmployeeHome.tsx` | **Major rewrite** -- restructure layout to Balady-style sections |

### Detailed Layout Structure

```text
+---------------------------------------+
|  Hero Banner (Check-in CTA / Done)    |
+---------------------------------------+
|  "Quick Access"  (horizontal scroll)  |
|  [Icon] [Icon] [Icon] [Icon] -->      |
+---------------------------------------+
|  "My Services"                        |
|  +----------------+ +----------------+|
|  | [ic] [ic]      | | [ic] [ic]      ||
|  | 4+   [ic]      | | 2+   [ic]      ||
|  | Wellness Tools | | Support        ||
|  +----------------+ +----------------+|
+---------------------------------------+
|  Mood History Chart (full width)      |
+---------------------------------------+
|  Burnout Indicator (full width)       |
+---------------------------------------+
```

### Implementation Details

1. **Hero Banner**: Replace greeting text + inline check-in with a gradient card (primary gradient) containing greeting, subtitle, and a prominent CTA button for check-in (or a success state if already done).

2. **Quick Access Row**: A horizontal scroll container (`overflow-x-auto flex gap-4`) with touch-friendly cards (80x80px icon area + label). Items: Daily Check-in, Survey, Mood Trend, Streak, Crisis Support, First Aider.

3. **Category Cards**: 2-column grid with glass cards. Each card has a 2x2 mini-icon grid, a "+N" services count, and a label. Clicking navigates to the relevant section.

4. **Existing Charts**: Mood History and Burnout Indicator remain as full-width glass cards at the bottom, unchanged.

5. **RTL Compliance**: All spacing uses logical properties (`ms-`, `me-`, `ps-`, `pe-`). Horizontal scroll direction is automatic with `dir="rtl"`.

### Technical Notes
- No new dependencies required
- Uses existing Lucide icons for the grid items
- Existing hooks (`useCurrentEmployee`, `useGamification`, `useMoodHistory`, `useScheduledQuestions`) remain unchanged
- All translations will use existing i18n keys where possible; new keys added for section headers
- Glass styling classes (`glass-card`, `glass-stat`) maintained for consistency

