

## Upgrade Mobile Bottom Navigation to Premium Style

### Changes — Single file: `src/components/layout/MobileBottomNav.tsx`

**1. Replace icons with bolder, filled-style alternatives**

| Route | Current Icon | New Icon | Rationale |
|-------|-------------|----------|-----------|
| Dashboard | `LayoutDashboard` | `House` | Cleaner, universally recognized home icon |
| Wellness | `Heart` | `HeartPulse` | More distinctive, thicker strokes |
| Support | `LifeBuoy` | `MessageCircle` | Modern messaging icon, cleaner geometry |
| Profile | `User` | `CircleUserRound` | Filled circle frame, more premium feel |
| Menu | `Menu` | `AlignJustify` | Slightly bolder hamburger variant |

All icons from `lucide-react` — no new dependencies.

**2. Increase icon size**
- Icons: `h-5 w-5` → `h-[22px] w-[22px]` with `strokeWidth={2.25}` for stronger presence

**3. Active state upgrade**
- Replace the tiny glowing dot with a **soft pill background** behind the icon: `bg-primary/12 rounded-xl px-4 py-1.5`
- Icon color: `text-primary` (brand color, not just foreground)
- Remove `scale-110` — the pill indicator is enough

**4. Inactive state**
- `text-muted-foreground/70` for softer muted tone with good contrast
- On hover: `text-muted-foreground` (subtle lift)

**5. Nav bar height & spacing**
- Height: `h-12` → `h-14` for breathing room
- Consistent `gap-0.5` between icon and optional indicator

**6. Menu button**
- Same sizing and inactive styling as nav items for consistency

This keeps the icon-only, minimal aesthetic while making the bar feel substantially more premium and app-native.

