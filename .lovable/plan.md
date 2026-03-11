

## Replace `font-medium` → `font-semibold` across 220 files

### Rationale
The Orbitask spec allows only Inter weights 400, 600, 700. Weight 500 was already removed from the Google Fonts import, so all 2,435 `font-medium` instances currently fall back to weight 400 (too light). Replacing with `font-semibold` (600) restores the intended visual hierarchy.

### Approach
Global search-and-replace of `font-medium` → `font-semibold` across all 220 files in `src/`. This is safe because:
- Weight 500 is no longer loaded, so `font-medium` already renders incorrectly
- Weight 600 (`font-semibold`) is the closest approved weight and matches the spec's intent for labels, nav items, and emphasis text
- No behavioral or layout changes — purely a weight bump from broken-500→600

### Scope
- 2,435 occurrences across 220 `.tsx`/`.ts` files
- Includes UI primitives (`accordion.tsx`, `calendar.tsx`, `navigation-menu.tsx`), page components, and feature components
- All replacements are identical: `font-medium` → `font-semibold`

