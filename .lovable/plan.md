

# Unify Two Notification Bells into One

## Problem
The header currently renders two separate notification bells — one for task notifications and one for crisis notifications — causing visual clutter (as seen in the uploaded screenshot).

## Approach
Create a single **UnifiedNotificationBell** component that merges both data sources and displays one bell with a combined unread count. Inside the popover, notifications from both systems are interleaved chronologically, with distinct icons per type.

## Changes

### 1. New: `src/components/notifications/UnifiedNotificationBell.tsx`
- Consumes both `useTaskNotifications()` and `useCrisisNotifications()`
- Merges notifications into a single array, sorted by `created_at` descending
- Normalizes both types into a common shape: `{ id, type, title, body, is_read, created_at, source: 'task' | 'crisis', navigateTo }`
- Combined `unreadCount` = task unread + crisis unread
- Single bell icon with one badge
- "Mark all as read" calls both `markAllRead` mutations
- Clicking a notification: tasks navigate to `/tasks/:id`, crisis to `/my-support`
- Renders type-specific icons from both existing icon maps
- Groups or labels items with a subtle "Tasks" / "Crisis" category indicator if needed for clarity

### 2. Modify: `src/components/layout/Header.tsx`
- Remove both `NotificationBell` and `TaskNotificationBell` imports
- Import and render the single `UnifiedNotificationBell`

### 3. Cleanup (optional, non-breaking)
- Keep the old bell components in place (they may be used elsewhere or useful for standalone contexts), but they will no longer render in the header

