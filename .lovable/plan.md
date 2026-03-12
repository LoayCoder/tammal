

## Fix: Sidebar Logo Too Small When Expanded

### Problem
The expanded sidebar logo is constrained to `h-10 max-w-[180px]` (40px tall, 180px wide). This makes the logo appear small, especially for logos with a horizontal aspect ratio.

### Fix
In `src/components/layout/AppSidebar.tsx` line 368, change the logo class from:
```
h-10 max-w-[180px] object-contain
```
to:
```
h-12 max-w-[200px] object-contain
```

This bumps the height from 40px → 48px and width cap from 180px → 200px, giving the logo proper visual weight in the sidebar header. The `object-contain` ensures it won't distort.

### Files
- `src/components/layout/AppSidebar.tsx` — one class change on line 368

