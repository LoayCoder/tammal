

# Fix Card Visibility — Clear Separation Across the App

## Problem
In light mode, the page background and card background are both **pure white** (`0 0% 100%`), and borders are extremely faint (`220 13% 91%`). Cards blend into the page with no visible separation.

## Solution
Adjust the CSS design tokens so cards are clearly distinguishable from the page background in both light and dark modes, without changing the premium aesthetic.

### Changes in `src/index.css`

**1. Light mode — shift page background to a subtle off-white**
- `--background`: change from `0 0% 100%` → `220 20% 98%` (very subtle cool gray)
- Keep `--card: 0 0% 100%` (cards stay white, now they pop against the tinted background)

**2. Light mode — strengthen borders and shadows**
- `--border`: change from `220 13% 91%` → `220 13% 88%` (slightly more visible)
- `--shadow-sm`: increase opacity from `0.05` → `0.08`
- `--shadow-md`: increase opacity from `0.07` → `0.10`

**3. Glass-card and glass-stat light mode — add subtle shadow by default**
- Add `box-shadow: var(--shadow-sm)` to `.glass-card` and `.glass-stat` base styles
- This gives every card a gentle lift even without hover

**4. Premium card light mode — slightly stronger border**
- `.premium-card` border opacity from `0.4` → `0.6`
- `.premium-card-vip` border opacity from `0.08` → `0.15`

**5. Base Card component — ensure shadow**
- In `src/components/ui/card.tsx`, the default Card already has `shadow-sm` which is good, but the `glass-card` variant overrides with `border-0`. Update `cardVariants.glass` in `src/theme/tokens.ts` to not strip border: keep `border-0` but rely on the glass-card CSS having its own border.

### Files to Modify
1. `src/index.css` — Background color, border strength, shadow values, glass-card/stat shadows
2. No other files need changes — the tokens and card components reference CSS variables

### Visual Result
- Light mode: cards appear as white rectangles floating on a subtle gray canvas with gentle shadows
- Dark mode: unchanged (already has good contrast)
- All existing card variants (glass, stat, premium, premiumVip) benefit automatically

