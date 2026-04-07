

# Apple-Style Landing Page Redesign

## Overview
Complete redesign of the Tammal landing page to match Apple's design philosophy: pure minimalism, typography-driven, no decorative elements, system fonts, black/white palette with cyan accent.

## Architecture Changes

### Remove Components
- `LandingValue.tsx` — merge into features
- `LandingShowcase.tsx` — replace with single product showcase
- `LandingVisual.tsx` — remove (redundant with showcase)
- `LandingUseCases.tsx` — remove per brief ("no testimonials/logos unless authentic")
- `LandingFAQ.tsx` — remove per brief (not in Apple structure)
- `AnimatedSection.tsx` — remove (no scroll animations per brief)
- `BrowserFrame.tsx` — remove (clean image with border-radius instead)

### Keep & Rewrite
- `LandingPage.tsx` — new nav (frosted glass, 56px, centered links) + minimal footer
- `LandingHero.tsx` — centered text, badge + H1 + subtitle + 2 buttons, no screenshot
- `LandingFeatures.tsx` — 6 feature cards in 3-col grid, no icons, minimal
- `LandingImpact.tsx` → rename to `LandingStats.tsx` — black bg, 4 stats in a row
- `LandingCTA.tsx` — centered text on white, single button

### New Component
- `LandingShowcaseNew.tsx` — 2-col (text left, product image right) on `#f5f5f7` bg

## Design System Changes

### `tailwind.config.ts`
- Replace `fontFamily.display` and `fontFamily.body` with system font stack: `-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica Neue, Arial, sans-serif`
- Keep `navy` and `teal` in colors (navy for internal app, teal/cyan `#06b6d4` as landing accent)

### `index.html`
- Remove Google Fonts import (Outfit + Work Sans) — system fonts only
- Update meta description and OG tags

## Section-by-Section

### 1. Navigation (in LandingPage.tsx)
- Fixed, 56px height, frosted glass (`bg-white/98 backdrop-blur-lg`)
- Left: Tammal logo (SVG)
- Center: Features | Enterprise | Pricing (14px, opacity hover)
- Right: "Sign In" text link + "Get Started" black button (6px radius)
- Border: `1px solid rgba(0,0,0,0.08)`

### 2. Hero (LandingHero.tsx)
- Full viewport centered, light gradient bg (`white → #f5f5f7`)
- Badge: "ENTERPRISE CONTROL" — 13px uppercase, cyan color
- H1: 64px bold, -1.5px tracking, max 8 words
- Subtitle: 18px, `#666`, one sentence
- Two buttons: "Start Free Trial" (black/white) + "Watch Demo" (border)
- No screenshot, no animation, no framer-motion

### 3. Features (LandingFeatures.tsx)
- White bg, centered section title (48px) + subtitle (18px gray)
- 3×2 grid of 6 cards: title (20px bold) + description (15px gray)
- No icons, no hover effects, no borders — just text
- Generous padding (100px vertical)

### 4. Product Showcase (new LandingShowcase.tsx)
- `#f5f5f7` bg, 2-col 50/50 layout
- Left: H2 (40px bold) + description (16px gray) + "Explore Features" link
- Right: Product screenshot with 12px border-radius, no shadow
- 100px vertical padding

### 5. Stats (LandingStats.tsx, replaces LandingImpact)
- Pure black bg, white text
- 4 stats in a row: number (42px bold) + label (14px gray uppercase)
- `10,000+` | `99.99%` | `<200ms` | `Zero`
- No icons, no detail text

### 6. CTA (LandingCTA.tsx)
- White bg, centered
- H2: 48px bold
- Subtitle: 16px gray
- Single "Start Free Trial" black button
- 100px padding

### 7. Footer (in LandingPage.tsx)
- `#f5f5f7` bg, `1px solid rgba(0,0,0,0.08)` top border
- Single centered line: `© 2025 Tammal. Enterprise control, simplified.`
- 13px, `#666`

## Localization
Update both `en.json` and `ar.json` landing keys to match the new Apple-style copy:
- Hero: "Stop managing permissions. Start leading."
- Features: 6 outcome-focused descriptions
- Stats: matter-of-fact labels
- CTA: "Ready to take control?"
- Footer: "Enterprise control, simplified."
- Nav: "Features", "Enterprise", "Pricing", "Sign In", "Get Started"

## Files Summary

| Action | File |
|--------|------|
| Rewrite | `LandingPage.tsx` (nav + footer + page structure) |
| Rewrite | `LandingHero.tsx` (centered, no animation) |
| Rewrite | `LandingFeatures.tsx` (6 cards, 3-col, text-only) |
| Rewrite | `LandingCTA.tsx` (minimal centered) |
| Rename+Rewrite | `LandingImpact.tsx` → `LandingStats.tsx` (black bg stats) |
| Create | `LandingShowcase.tsx` (2-col product image) |
| Delete | `LandingValue.tsx`, `LandingVisual.tsx`, `LandingUseCases.tsx`, `LandingFAQ.tsx`, `LandingTrust.tsx`, `AnimatedSection.tsx`, `BrowserFrame.tsx` |
| Edit | `tailwind.config.ts` (system fonts) |
| Edit | `index.html` (remove Google Fonts) |
| Edit | `en.json` + `ar.json` (landing keys) |

