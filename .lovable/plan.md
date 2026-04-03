

# Fix Tabs Overflow & Hide Scrollbar Completely

## Problems
1. **Tabs overflow on mobile (390px)**: Three pill tabs with `px-4` padding and `rounded-full` don't fit in a 390px viewport — they spill off-screen.
2. **Scrollbar still visible**: Current CSS makes it thin but not hidden.

## Changes

### 1. `src/pages/Dashboard.tsx` — Responsive compact tabs
- Remove `rounded-full` from `TabsList` — use `rounded-lg` instead
- Reduce tab padding on mobile: `px-2 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`
- Use `w-full` on TabsList so tabs fill available width
- Use `flex-1` on each TabsTrigger so they share space equally
- Change tab shape from `rounded-full` to `rounded-md` for better space efficiency

### 2. `src/index.css` — Completely hide scrollbar
Replace the current minimal scrollbar styles with full hiding:
```css
* {
  scrollbar-width: none; /* Firefox */
}
::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Edge */
}
```
Remove the thumb/track styles since scrollbar is fully hidden.

## Files
| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Compact responsive tabs |
| `src/index.css` | Hide scrollbar completely |

