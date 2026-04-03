

# Bottom Nav — Minimal Line (Linear Style)

## Design
Icon-only bottom bar with no text labels. Solid white (light) / dark background. Thin `border-t` on top. Active item gets a small 4px dot below the icon in `primary` color. Very minimal, very Linear.

## Changes

### `src/components/layout/MobileBottomNav.tsx`
- Remove `glass-header` class; use `bg-background border-t border-border`
- Remove all `<span>` text labels — icons only
- Remove `rounded-xl` from buttons
- Active state: add a small dot indicator (`w-1 h-1 rounded-full bg-primary`) below the icon
- Inactive: `text-muted-foreground`, Active: `text-foreground` (not `text-primary` — Linear uses foreground)
- Icon size stays `h-5 w-5`
- Bar height reduced to `h-12` (tighter without labels)

| File | Change |
|---|---|
| `src/components/layout/MobileBottomNav.tsx` | Icon-only, dot indicator, solid bg, no glass |

