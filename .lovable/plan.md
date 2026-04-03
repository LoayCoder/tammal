

## Align `/dev/design-system` with Current Styles

### Problem
The design system page (v1.0.0, last updated 2026-03-07) is missing several style additions made since then: premium/VIP card demos, shadow tokens, font family display, status/semantic colors, and the new Islamic Calendar widget style.

### Changes — Single File: `src/pages/dev/DesignSystemPage.tsx` + `src/theme/version.ts`

**1. Add missing color sections**
- Add **Status Colors** row: success, warning, info + their tint backgrounds
- Add **Semantic Colors** swatches (success, warning, info, destructive)

**2. Add Shadow Tokens section**
- Display all shadow levels (2xs through 2xl + tooltip) as visual boxes with labels

**3. Add Font Families section**
- Show Inter (sans), Lora (serif), Space Mono (mono) with sample text for each

**4. Add Premium Card Variants showcase**
- Live demos of `premium-card`, `premium-card-vip`, `vip-stat-chip`, `premium-badge` CSS classes
- Show hover interaction on premium-interactive

**5. Add Islamic Calendar widget style reference**
- Document the border style pattern: `border bg-transparent border-[#69cbfc]/35 shadow-md`
- Document the lightweight badge pattern

**6. Update version metadata**
- Bump version to `1.1.0` and `lastUpdated` to `2026-04-03` in `src/theme/version.ts`

### Files Modified
- `src/pages/dev/DesignSystemPage.tsx` — add 4 new sections
- `src/theme/version.ts` — bump version

