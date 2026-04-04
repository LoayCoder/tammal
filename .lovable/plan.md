

## Update Bottom Nav: Support Tickets → Peer Support

### What Changes

The `Send` icon in the bottom nav currently links to `/support` (support tickets page). Change it to link to `/crisis-support` (the Peer Support / Crisis Request page).

**`src/components/layout/MobileBottomNav.tsx`**

- Change nav item on line 8:
  - **key**: `support` → `peer-support`
  - **path**: `/support` → `/crisis-support`
  - Icon stays as `Send` (fits the "reach out" concept)

Support tickets remain accessible via the sidebar menu.

### Files Modified
| File | Change |
|------|--------|
| `src/components/layout/MobileBottomNav.tsx` | Change support item path to `/crisis-support` |

