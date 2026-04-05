

## Fix Copilot CTA Routes & Refresh Button

### Problem 1: "Complete Check-in" and other CTAs lead to 404

The `CopilotActionBlock` and `CopilotEmptyState` components use hardcoded routes like `/employee`, `/employee/workload`, `/employee/wellness-tools`, `/employee/tasks` — none of which exist in the router. The actual routes are:

| Broken CTA route | Correct route |
|---|---|
| `/employee` (complete_checkin) | `/employee/wellness` |
| `/employee/workload` | `/my-workload` |
| `/employee/wellness-tools` | `/wellness` |
| `/employee/tasks` | `/my-workload` |

### Problem 2: Refresh button

The `refetch()` wiring in `useCopilotInsight` is correct — TanStack Query's `refetch()` bypasses `staleTime`. However, the edge function logs show only boot/shutdown cycles with no actual request logs, suggesting requests may be silently failing. The refresh button itself is functional code-wise.

### Problem 3: Console warning (minor)

`CopilotReasoningBlock` is a function component receiving a ref — needs `React.forwardRef` or the parent should stop passing a ref.

### Changes

**File 1: `src/features/wellness-copilot/components/CopilotActionBlock.tsx`**
- Update `ctaRoutes` map to use real router paths:
  - `complete_checkin` → `/employee/wellness`
  - `review_workload` → `/my-workload`
  - `take_break` → `/wellness`
  - `review_tasks` → `/my-workload`

**File 2: `src/features/wellness-copilot/components/CopilotEmptyState.tsx`**
- Same route fixes in `ctaMap`

