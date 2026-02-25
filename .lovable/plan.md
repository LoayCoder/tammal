

## Fix: Logo Size and Alignment in Sidebar

### Issues Found

1. **ThemeLogo ignores `className` prop** -- The component receives a `className` prop but never uses it. The `<img>` tag hardcodes `className="object-contain border-0"`, so the `h-14 max-w-[200px]` passed from the sidebar has no effect, making the logo render at its natural (large) size.

2. **Logo is centered instead of end-aligned** -- The sidebar header uses `justify-center`, but you want it aligned to the end (right in LTR).

### Fix Plan

**File 1: `src/components/branding/ThemeLogo.tsx`** (line 34)
- Apply the `className` prop to the `<img>` element so size constraints from parent components actually take effect.
- Change: `className="object-contain border-0"` to use the passed `className` merged with defaults.

**File 2: `src/components/layout/AppSidebar.tsx`** (lines 253, 267)
- Change the wrapper from `justify-center` to `justify-end` so the logo aligns to the end (right side in LTR, left in RTL -- using logical alignment).
- Reduce logo height from `h-14` to `h-10` for a more appropriate size.

### Result
- The logo will render at a controlled, smaller size (`h-10`, max-width 200px).
- It will be aligned to the end of the sidebar header (right side in LTR).

