

# Glassmorphism UI for Employee Dashboard (EmployeeHome)

## Overview

Apply a frosted-glass (glassmorphism) design to the Employee Dashboard page. This involves translucent backgrounds with backdrop blur, subtle borders, and soft shadows across all cards and containers on the `EmployeeHome` component.

## Visual Style

- **Cards**: Semi-transparent backgrounds with `backdrop-blur`, white/dark translucent fills, and light border
- **Badges**: Glass-style with translucent backgrounds
- **Charts**: Glass container with blurred backdrop
- **Check-in Card**: Frosted overlay with accent tint
- **Background**: A subtle gradient mesh behind the page content to make the glass effect visible

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/EmployeeHome.tsx` | Apply glass classes to all Card components, badges, and wrapper; add a decorative gradient background |
| `src/index.css` | Add reusable `.glass` and `.glass-card` utility classes for glassmorphism (backdrop-blur, semi-transparent bg, subtle border) |

## Technical Details

### 1. New CSS Utilities (`src/index.css`)

Add under `@layer components`:

```css
.glass {
  background: hsl(var(--card) / 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.3);
  box-shadow: 0 8px 32px hsl(0 0% 0% / 0.06);
}

.glass-card {
  background: hsl(var(--card) / 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--border) / 0.25);
  box-shadow:
    0 8px 32px hsl(0 0% 0% / 0.08),
    inset 0 1px 0 hsl(0 0% 100% / 0.1);
}

.glass-badge {
  background: hsl(var(--secondary) / 0.35);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.2);
}
```

Dark mode variants will inherit automatically since CSS variables switch.

### 2. EmployeeHome Page Updates (`src/pages/EmployeeHome.tsx`)

- Wrap the entire page content in a container with decorative gradient blobs (using absolute-positioned divs with `bg-primary/10`, `bg-chart-1/10`, `bg-chart-2/10` and large `blur-3xl` / `rounded-full`)
- Replace all `<Card>` instances with `<Card className="glass-card border-0">` to override the default opaque card background
- Replace Badge components with `<Badge className="glass-badge">` for translucent tag pills
- The chart tooltip container already uses inline styles -- update those to use translucent background
- The completed check-in card and survey card get accent-tinted glass: `glass-card` plus their existing accent color at reduced opacity

### 3. RTL Compliance

No directional properties are being changed -- all modifications use background, backdrop-filter, border, and box-shadow which are direction-agnostic.

### 4. Dark Mode

The glass utilities use CSS variables (`--card`, `--border`) which already switch between light and dark themes, so the glassmorphism will adapt automatically. The gradient background blobs will use low-opacity theme colors that look good in both modes.

