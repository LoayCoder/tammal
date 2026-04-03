

# Mobile Bottom Nav — Fix Routes & Premium UI Upgrade

## Problems Found
1. **Broken routes**: `/wellness` and `/profile` don't exist in the router
   - `/wellness` should point to `/employee/wellness` (Daily Check-in) or `/mental-toolkit`
   - `/profile` should point to `/settings/profile`
2. **UI is too plain** for a premium VIP feel — needs subtle polish

## Correct Route Mapping

| Nav Item | Current (broken) | Fixed Path |
|----------|------------------|------------|
| Dashboard | `/` | `/` (correct) |
| Wellness | `/wellness` | `/employee/wellness` |
| Support | `/support` | `/support` (correct) |
| Profile | `/profile` | `/settings/profile` |

## Premium UI Enhancements (Linear-inspired, elevated)

- **Backdrop blur** on the nav bar: `bg-background/80 backdrop-blur-xl` for a frosted-glass premium feel
- **Smooth transitions**: `transition-all duration-200` on icons for color and scale
- **Active icon scale**: slight `scale-110` on the active icon for emphasis
- **Dot indicator**: upgrade from plain dot to a `bg-primary` pill with subtle glow via `shadow-[0_0_6px_var(--primary)]`
- **Menu button**: add a subtle hover state
- **Safe area**: keep `env(safe-area-inset-bottom)` for notched devices

## File Changes

### `src/components/layout/MobileBottomNav.tsx`
- Fix all `path` values in `navItems` array
- Apply premium backdrop-blur bar styling
- Add `transition-all duration-200` and active scale to buttons
- Upgrade dot indicator with primary glow
- Keep icon-only minimal line approach (no labels)

## Single file change, all fixes in one update.

