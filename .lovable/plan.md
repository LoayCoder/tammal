

# Convert Landing Page to Light Mode

## Overview
The entire landing page currently uses a hardcoded dark theme (`bg-[#0A0E1A]`, `text-white`, `border-white/[0.06]`, etc.). Every component needs its color palette converted to a clean, professional light design.

## Color Mapping

| Dark (current) | Light (new) |
|----------------|-------------|
| `bg-[#0A0E1A]` | `bg-white` / `bg-gray-50` |
| `text-white` | `text-gray-900` |
| `text-white/50`, `text-white/40` | `text-gray-500` |
| `text-white/30`, `text-white/25` | `text-gray-400` |
| `border-white/[0.06]` | `border-gray-200` |
| `bg-white/[0.02]`, `bg-white/[0.04]` | `bg-gray-50` / `bg-white` |
| `bg-blue-600/[0.06]` glows | `bg-blue-100/50` subtle glows |
| Nav `bg-[#0A0E1A]/90` | `bg-white/90` with `text-gray-900` |
| `from-blue-400 to-blue-200` gradient text | `from-blue-600 to-blue-500` |

## Files Modified (8 files)

| File | Key Changes |
|------|-------------|
| **LandingPage.tsx** | Root `bg-white text-gray-900`, nav bg-white with dark text, footer light borders |
| **LandingHero.tsx** | White bg, dark headings, lighter glows, badge with gray border, CTA button `bg-blue-600 text-white` (inverted) |
| **LandingValue.tsx** | Light section labels, dark headings, cards with `border-gray-200 bg-white` |
| **LandingShowcase.tsx** | Dark text, light numbered labels |
| **LandingFeatures.tsx** | Light card backgrounds, dark text, blue-50 icon boxes |
| **LandingVisual.tsx** | Light labels and headings |
| **LandingTrust.tsx** | Light stat text, light trust cards |
| **LandingCTA.tsx** | CTA card with light gradient bg, `bg-blue-600 text-white` primary button |
| **BrowserFrame.tsx** | Light title bar (`bg-gray-100`), light content bg (`bg-gray-50`) |

## Design Approach
- Clean white/gray-50 backgrounds
- Primary blue (`blue-600`) for CTAs and accents
- Gray-900 for headings, gray-500 for body text, gray-400 for labels
- Subtle gray-200 borders instead of white-alpha borders
- Ambient glows become soft blue-100/purple-100 tints
- Professional, minimal — consistent with the app's Linear-inspired design system

