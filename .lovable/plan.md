

## Fix Notification Panel for Mobile

### Problem
The notification popover (`w-80` = 320px) overflows the viewport on mobile (384px wide), and the 4-tab bar with badges causes cramped/overlapping text. The popover also floats awkwardly over the dashboard content as seen in the screenshot.

### Approach
Use a **Drawer** (bottom sheet) on mobile and keep the **Popover** on desktop — a common responsive pattern.

### Changes — Single File: `src/components/notifications/UnifiedNotificationBell.tsx`

1. **Import `useIsMobile`** hook and Drawer components (`Drawer, DrawerContent, DrawerTrigger, DrawerTitle`)
2. **Conditional rendering**:
   - **Mobile**: Render a `Drawer` that slides up from the bottom, full-width, with `max-h-[85vh]`
   - **Desktop**: Keep the existing `Popover` as-is
3. **Shared notification content**: Extract the header, tabs, and notification list into a shared inner component to avoid duplication
4. **Tab bar mobile fix**: On mobile, use shorter labels (icons only or abbreviated text) and smaller badge sizing to prevent overflow. Use `text-2xs` and remove badge `ms-1` margin on small screens
5. **ScrollArea height**: On mobile, use `max-h-[60vh]` for the list to leave room for the tab bar and header

### Technical Details
- `useIsMobile()` detects `<768px` viewport
- Drawer uses `vaul` (already installed) for native-feeling swipe-to-dismiss
- The trigger button stays identical in both cases
- RTL compliance maintained (logical properties only)

