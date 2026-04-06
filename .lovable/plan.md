

# VIP Premium Landing Page — Implementation Plan

## Overview
Build a flagship, enterprise-grade landing page at `/landing` as a public route (no auth required). The page targets executives and investors with a minimal luxury aesthetic — deep navy/black palette, clean typography, subtle scroll animations, and premium app screenshot presentations.

## Technical Approach

- **Route**: Add `/landing` as a public route in `App.tsx` (outside `ProtectedRoute`). The existing `/` stays as the authenticated dashboard.
- **Animation**: Install `framer-motion` for scroll-triggered fade/slide animations. All animations are subtle (10-20px y-axis, opacity transitions, no bounce).
- **Screenshots**: Use placeholder premium dashboard mockups rendered inside macOS-style browser frames with soft shadows. These can be swapped for real screenshots later.
- **Color palette**: Landing page uses its own scoped dark theme — deep navy (`#0A0E1A`), white, soft gray, muted blue accent. Does not alter the app's existing design tokens.
- **RTL**: All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).

## Component Structure

| Component | Purpose |
|-----------|---------|
| `LandingPage.tsx` | Page wrapper, full layout |
| `LandingHero.tsx` | Hero with headline + screenshot mockup |
| `LandingValue.tsx` | 3-column value proposition |
| `LandingShowcase.tsx` | Alternating text+screenshot sections |
| `LandingFeatures.tsx` | 4-column feature card grid with hover effects |
| `LandingVisual.tsx` | Large screenshot composition |
| `LandingTrust.tsx` | Enterprise positioning statements |
| `LandingCTA.tsx` | Final centered call-to-action |
| `BrowserFrame.tsx` | Reusable macOS-style frame for screenshots |
| `AnimatedSection.tsx` | Reusable scroll-triggered fade-in wrapper |

All components go in `src/components/landing/`.

## Page Sections (in order)

1. **Hero** — Split layout: left headline ("Enterprise Intelligence, Elevated.") + CTA button, right side shows dashboard screenshot in browser frame with fade-in reveal
2. **Value Proposition** — 3 columns: Intelligent Operations, Advanced Insights, Executive Control — minimal icons, short copy
3. **Product Showcase** — 3 alternating blocks (left/right) showing Dashboard, Analytics, and AI Copilot screenshots with titles and descriptions
4. **Feature Cards** — 4-column grid with icon + title + description, subtle hover lift effect
5. **Visual Experience** — Large hero-width screenshot composition with layered depth
6. **Trust/Positioning** — Enterprise-ready messaging, security, compliance, scale
7. **Final CTA** — Centered "Request Private Access" button with premium styling

## Files to Create/Modify

| Action | File |
|--------|------|
| Install | `framer-motion` package |
| Create | `src/components/landing/LandingPage.tsx` (page with all sections) |
| Create | `src/components/landing/LandingHero.tsx` |
| Create | `src/components/landing/LandingValue.tsx` |
| Create | `src/components/landing/LandingShowcase.tsx` |
| Create | `src/components/landing/LandingFeatures.tsx` |
| Create | `src/components/landing/LandingVisual.tsx` |
| Create | `src/components/landing/LandingTrust.tsx` |
| Create | `src/components/landing/LandingCTA.tsx` |
| Create | `src/components/landing/BrowserFrame.tsx` |
| Create | `src/components/landing/AnimatedSection.tsx` |
| Modify | `src/App.tsx` — add `/landing` public route |
| Modify | `src/pages/Index.tsx` — redirect to `/landing` or render `LandingPage` |

## Design Details

- **Typography**: Inter font, headline ~4xl-6xl bold with tight tracking, body text gray-300/400
- **Spacing**: 8px system, generous vertical padding (py-24 to py-32 per section)
- **Cards**: Dark glass cards with subtle border, backdrop-blur, hover:translate-y-[-4px] transition
- **CTA buttons**: White text on transparent border, hover fills white with dark text
- **Browser frames**: Traffic light dots, dark title bar, rounded-xl corners, shadow-2xl
- **Mobile**: Sections stack vertically, screenshots scale down, animations remain smooth
- **Nav**: Minimal floating navbar with logo text + single CTA button

