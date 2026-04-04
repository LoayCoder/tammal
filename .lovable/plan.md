

## Move Support Hub to Top as Premium Collapsible Card

### What Changes

**1. `src/pages/EmployeeHome.tsx`**

- **Move** the Support Hub section from the bottom (lines 166-183) to right after the greeting section (after line 91, before DashboardEndorsementRequests)
- **Replace** the current grid layout with a **collapsible card** using Radix `Collapsible` (already installed)
- **Collapsed state** (default): A slim, elegant card showing a single row:
  - Left: subtle icon (`HeartHandshake`, strokeWidth 1.5) + title "Support Hub" (bold, small)
  - Right: `ChevronDown` icon that rotates 180° when open
  - Entire card clickable as trigger
- **Expanded state**: Smoothly reveals the 2-column grid of support buttons (Crisis Support + First Aider) below the trigger row
- Card styling: `premium-card rounded-2xl` with `hover:shadow-sm transition-all duration-200`
- Expanded content: `p-4 pt-0` with the existing 2-col grid, same icon/label cards but with `rounded-xl` and subtle hover lift

**2. Interaction Details**
- `ChevronDown` rotates with `transition-transform duration-200` → `rotate-180` when open
- Content area uses `CollapsibleContent` with CSS animation for smooth expand/collapse
- Support buttons keep existing navigation behavior (Link to `/crisis-support`, onClick for First Aider popup)

### Files Modified
| File | Change |
|------|--------|
| `src/pages/EmployeeHome.tsx` | Move Support Hub to top, wrap in Collapsible with premium card styling |

