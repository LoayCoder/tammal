

# VIP Premium Landing Page — Elevation Plan

## Current State
The landing page at `/landing` already exists with all 7 sections, framer-motion animations, BrowserFrame mockups, and the deep navy palette. The foundation is solid. This plan elevates every section to meet the "would an executive trust this?" bar.

## Changes Overview

### 1. Navigation — Add scroll-aware blur + logo refinement
- Add `useScrollY` state so nav background opacity increases on scroll
- Add subtle bottom border glow on scroll
- Increase logo weight/tracking for premium feel

### 2. Hero Section — Premium glow + layered depth
- Add a second ambient glow (violet, opposite corner) for depth
- Add subtle floating animation on the BrowserFrame (gentle 6px y-axis oscillation, 6s cycle)
- Upgrade badge pill styling with a subtle shimmer/border gradient
- Refine headline: tighter line-height, slightly larger on desktop (7xl)
- Add a thin horizontal rule or accent line between headline and body text

### 3. Value Proposition — Elevated card design
- Add subtle gradient border on hover (not fill — border shimmer)
- Increase icon container to 12×12 with softer rounded-xl
- Add a faint top-edge highlight line on each card (1px gradient)

### 4. Product Showcase — Fix RTL hack + add stagger
- Replace `[direction:rtl]` hack with proper `order` classes (`lg:order-first` / `lg:order-last`) for correct RTL support
- Add staggered reveal: text appears first, then screenshot slides in with 200ms delay
- Add a subtle number accent glow behind the "01/02/03" labels

### 5. Feature Cards — Add micro-interaction + glass depth
- Add `backdrop-blur-sm` for glass effect
- Add icon color shift on hover (blue-400 → blue-300)
- Add subtle card border glow on hover using `shadow-[0_0_20px_rgba(59,130,246,0.06)]`

### 6. Visual Experience — Layered composition
- Add a second smaller BrowserFrame behind/offset from the main one (showing a different view like "Analytics" or "Team Pulse")
- Apply `transform: perspective(1200px) rotateY(-2deg)` on the back frame for depth
- Add ambient glow beneath the composition

### 7. Trust Section — Premium metric strip
- Add a horizontal stats strip above the trust cards showing key numbers: "10,000+ Tenants", "99.99% Uptime", "SOC 2 Ready", "< 200ms Response"
- Upgrade trust card icons with subtle gradient fills
- Add a faint divider line between stats strip and cards

### 8. CTA Section — Exclusive feel
- Add a radial gradient spotlight effect behind the CTA box
- Add a subtle animated border (slow gradient rotation) around the CTA container
- Upgrade button hover: white → slight blue tint transition

### 9. Footer — Minimal polish
- Add subtle link hover underline animation
- Slightly increase footer padding

### 10. Mobile Responsiveness Pass
- Ensure hero screenshot scales cleanly below `lg` (already stacks, verify padding)
- Reduce Visual section's layered frames to single on mobile
- Ensure feature cards go to single column on `< sm`
- Verify all animations have `reduced-motion` respect via framer-motion defaults

## Files to Modify

| File | Changes |
|------|---------|
| `LandingPage.tsx` | Scroll-aware nav, footer polish |
| `LandingHero.tsx` | Dual glow, floating animation, refined typography, badge shimmer |
| `LandingValue.tsx` | Card border highlight, icon container upgrade |
| `LandingShowcase.tsx` | Fix RTL ordering, stagger animation, number glow |
| `LandingFeatures.tsx` | Glass cards, hover glow, icon transitions |
| `LandingVisual.tsx` | Layered dual-frame composition, perspective depth |
| `LandingTrust.tsx` | Stats strip, upgraded card styling |
| `LandingCTA.tsx` | Animated border, radial spotlight, button refinement |
| `AnimatedSection.tsx` | No changes needed |
| `BrowserFrame.tsx` | No changes needed |

## Design Constraints
- No new dependencies — framer-motion + Tailwind + lucide-react are sufficient
- No bright colors — muted blue/violet accents only
- All animations < 1s duration, no bounce easing
- Logical properties maintained throughout (ms/me/ps/pe)
- No changes to existing app theme or routes

