

# Dashboard Premium VIP Upgrade

## Approach
Introduce a premium visual layer through CSS utilities and token updates — no layout changes. The upgrade touches the global stylesheet, design tokens, and key dashboard components.

## File Changes

### 1. `src/index.css` — Premium CSS utilities
- Add `.premium-bg` class: subtle gradient background (`background: linear-gradient(180deg, hsl(var(--background)), hsl(220 60% 98%))`) with dark mode variant
- Add `.premium-card` class: soft gradient background (white to very faint blue tint), subtle inner highlight via `box-shadow: inset 0 1px 0 0 hsl(0 0% 100% / 0.6)`, stronger but soft outer shadow, very low-opacity border
- Add `.premium-card-vip` extends premium-card with faint primary glow border (`box-shadow: 0 0 0 1px hsl(var(--primary) / 0.12), inset 0 1px 0 0 hsl(0 0% 100% / 0.6), var(--shadow-md)`)
- Add `.premium-badge` class: pill with soft gradient background, subtle border
- Add `.premium-interactive` class: `transition: all 200ms ease; &:hover { transform: translateY(-1px) scale(1.005); box-shadow: var(--shadow-lg) } &:active { transform: scale(0.985) }`
- Add `.vip-text-highlight` class: subtle gradient text or bold emphasis style
- Dark mode variants for all premium classes using cool-toned dark equivalents

### 2. `src/theme/tokens.ts` — New premium variants
- Add `cardVariants.premium`: `'premium-card premium-interactive rounded-xl'`
- Add `cardVariants.premiumVip`: `'premium-card-vip premium-interactive rounded-xl'`
- Add `typography.greeting`: `'text-2xl md:text-3xl font-bold tracking-tight'`
- Add `typography.vipName`: `'text-primary font-extrabold'` (for username emphasis)

### 3. `src/pages/EmployeeHome.tsx` — Premium greeting + badges + layout
- Wrap entire page content in a container with `premium-bg min-h-full`
- **Greeting**: Use `typography.greeting`, wrap `firstName` in `<span className={typography.vipName}>` for emphasis
- **Gamification badges**: Replace `glass-badge` with `premium-badge` class, add subtle icon glow
- **Check-in done card**: Use `cardVariants.premiumVip` instead of `cardVariants.glass`, add success tint gradient background via inline style or utility
- **Prayer widget card, Islamic calendar card**: Use `cardVariants.premiumVip` (these are "important" cards)
- **Survey card, tool cards, quick action cards**: Use `cardVariants.premium` with `premium-interactive`
- **Section titles**: Increase spacing slightly (space-y-8 between major sections)
- Add small VIP badge near greeting: `<Badge className="premium-badge text-xs gap-1"><Crown className="h-3 w-3 text-amber-500" /> VIP</Badge>` — minimal, not gold-heavy

### 4. `src/components/checkin/InlineDailyCheckin.tsx` — Premium check-in card
- Replace `border-2 border-primary/20` with `premium-card-vip` class
- Add soft gradient background tint (success/primary)
- Icon circle for header with subtle background
- Keep existing functionality untouched

### 5. `src/components/dashboard/DashboardPrayerWidget.tsx` — Premium prayer card
- Apply `cardVariants.premiumVip` to the main card
- Completion celebration: larger emoji, bolder text, subtle emphasis class
- Hadith section: add inner container with slight background contrast (`bg-muted/5 rounded-lg p-3`) and better spacing

### 6. `src/components/dashboard/PersonalMoodDashboard.tsx` — Premium stat cards
- Apply `cardVariants.premium` to mood stat cards
- Color-coded accent backgrounds on stat indicators (not flat icons)

### 7. `src/components/dashboard/MentalHealthToolsHub.tsx` — Premium tool cards
- Replace `cardVariants.glass` with `cardVariants.premium`
- The `premium-interactive` hover/tap effects replace manual ring hover styles

## What stays the same
- All layout structure, grid columns, component order
- All functionality and data flows
- RTL compliance (logical properties only)
- Dark mode support (premium classes include dark variants)

## Summary
8 files total: 1 CSS file, 1 tokens file, 6 component files. Pure visual upgrade with no structural changes.

