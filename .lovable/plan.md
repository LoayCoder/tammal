

## Apply Lucide Minimal Icon Set to Bottom Navigation

### File: `src/components/layout/MobileBottomNav.tsx`

**Icon replacements:**

| Route | Current Icon | New Icon | Why |
|-------|-------------|----------|-----|
| Dashboard `/` | `House` | `Dot` | Abstract home marker |
| Wellness `/employee/wellness` | `HeartPulse` | `Waves` | Calm, wellness-aligned |
| Support `/support` | `MessageCircle` | `Send` | Clean communication symbol |
| Profile `/settings/profile` | `CircleUserRound` | `Fingerprint` | Unique identity icon |
| Menu (sidebar) | `AlignJustify` | `Grip` | Minimal grid/menu pattern |

**Import change:** Replace icon imports with `Dot, Waves, Send, Fingerprint, Grip` from `lucide-react`.

All other styling (pill active state, size, strokeWidth, spacing) stays unchanged.

