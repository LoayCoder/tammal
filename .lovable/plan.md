

## Redesign "My Workload" Widget — Premium VIP Style

### Overview
Transform the DashboardWorkloadWidget from a heavy, boxed layout into a clean, minimal executive-style summary with better hierarchy, lighter visuals, and breathing room.

### Changes (single file: `src/components/dashboard/DashboardWorkloadWidget.tsx`)

**1. Header — Stronger title, subtler "View All"**
- Make title `text-base font-semibold` (keep) but remove the icon next to it for cleaner look
- Keep "View All" as a minimal text link with `text-xs` and muted color

**2. Stats Row — Remove grey boxes, use open layout**
- Remove `bg-muted/50 rounded-lg p-2` containers entirely
- Layout as a horizontal flex row with subtle vertical dividers (`border-e border-border/40`) between items
- Each stat: icon (h-3.5, strokeWidth 1.5, muted color) → large number (`text-xl font-bold`) → small label (`text-[10px] text-muted-foreground`)
- Use spacing/whitespace instead of containers

**3. Completion Rate — Thinner, refined progress bar**
- Reduce progress bar height from `h-2` to `h-1.5`
- Keep label row minimal with `text-[11px]`

**4. Task List — Clean rows with subtle separators**
- Remove `bg-muted/30 rounded-md` background from task items
- Use `border-b border-border/30` as subtle separator instead
- Increase vertical padding (`py-2.5`) for breathing room
- Keep: left priority dot, center task title, right date as muted text (remove Badge/outline pill)

**5. Outer Card — Lighter container**
- Use `premiumVip` card variant for the premium glow aesthetic
- Remove `ring-1 ring-primary/10`

**6. Spacing — More vertical breathing room**
- Increase `space-y-4` to `space-y-5` in CardContent
- Add `pt-5` instead of `pt-4`

### Visual Result

```text
┌─────────────────────────────────────┐
│  My Workload              View All →│
│                                     │
│  🕐  ✓  ⚠  ☑                       │
│   3  │  7  │  1  │  2              │
│  Act │ Done│ Over│ Appr            │
│                                     │
│  Completion Rate              58%   │
│  ━━━━━━━━━━━━━━━━━━░░░░░░░░░░      │
│                                     │
│  Upcoming                           │
│  ● Design review           Mar 28   │
│  ─────────────────────────────────  │
│  ● Q2 planning             Apr 1    │
│  ─────────────────────────────────  │
│  ● Budget approval         Apr 3    │
└─────────────────────────────────────┘
```

### Files Modified
- `src/components/dashboard/DashboardWorkloadWidget.tsx` — full visual redesign, no logic changes

