

# Fix Sidebar Popup Overflow & Build Errors

## 1. Sidebar Popup Clipping (`src/components/layout/sidebar/SidebarPopup.tsx`)

The popup is positioned at `left: anchorRect.right + 8` with a fixed `w-[180px]`, which overflows on smaller screens.

**Fix**: Add viewport boundary detection. After calculating position, check if `left + 180 > window.innerWidth` and clamp accordingly. Also add `max-h` with overflow-y-auto in case it overflows vertically.

## 2. Build Error Fixes

### `CategoryHealthChart.tsx` (line 50)
`entry.category` doesn't exist — chartData only has `{ name, score, color, responses }`. Change `entry.category` to `entry.name` in the Cell key.

### `MoodTrackerTool.tsx` (line 170)
`entry.date` doesn't exist — chartData only has `{ day, score, emoji }`. Change `entry.date` to `entry.day` in the Cell key.

### `scheduleService.ts` (lines 94, 103, 112)
Supabase `.then()` returns `PromiseLike`, not `Promise`. Fix by wrapping each with `Promise.resolve(...)` or changing the array type to `PromiseLike<void>[]`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/sidebar/SidebarPopup.tsx` | Clamp popup position within viewport |
| `src/components/dashboard/CategoryHealthChart.tsx` | `entry.category` → `entry.name` |
| `src/components/mental-toolkit/tools/MoodTrackerTool.tsx` | `entry.date` → `entry.day` |
| `src/services/scheduleService.ts` | Fix `PromiseLike` type mismatch |

