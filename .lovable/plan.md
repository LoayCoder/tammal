

## Phase 10 — Notifications and Action Enablement

### Assessment

The platform has a mature **UnifiedNotificationBell** component that merges Task, Crisis, and Recognition notification streams with realtime subscriptions and browser push. However, there is **no engagement/pulse notification channel** — the `task_notifications` table requires a `task_id` FK and cannot be repurposed.

### Plan

#### 1. Create `engagement_notifications` table

**Migration** — New table modeled after `task_notifications` but without `task_id` dependency:

```
engagement_notifications (
  id UUID PK,
  tenant_id UUID NOT NULL FK → tenants,
  recipient_id UUID NOT NULL FK → employees,
  type TEXT NOT NULL,  -- validated via trigger
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  action_path TEXT,  -- optional route to navigate to
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
)
```

- RLS: tenant isolation + recipient can read/update own
- Validation trigger for `type` enum: `engagement_drop`, `appreciation_reminder`, `pulse_nudge`, `action_followup`, `manager_team_alert`
- Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE engagement_notifications`

#### 2. Create `engagement-notifier` edge function

**New file**: `supabase/functions/engagement-notifier/index.ts`

Scheduled function (pg_cron, daily) that:
1. Queries employees with engagement scores below threshold (from `pulse_targets`, last entry per employee)
2. For **managers**: creates `manager_team_alert` notification if any direct report has score < 40
3. For **employees**: creates `appreciation_reminder` if zero appreciations sent in last 14 days
4. For **employees**: creates `action_followup` if they have an unacted CTA logged > 3 days ago
5. Deduplication: skip if same `type` + `recipient_id` notification exists within last 48h
6. Professional, premium-language titles/bodies (bilingual via `language` metadata field)
7. Caps at 2 notifications per employee per day (no spam)

#### 3. Create `useEngagementNotifications` hook

**New file**: `src/features/team-pulse/hooks/useEngagementNotifications.ts`

- Queries `engagement_notifications` for current employee
- Realtime subscription on INSERT for live updates
- `markRead` / `markAllRead` mutations
- Returns `{ notifications, unreadCount, markRead, markAllRead }`

#### 4. Integrate into UnifiedNotificationBell

**File**: `src/components/notifications/UnifiedNotificationBell.tsx`

- Add `engagement` as a 4th `NotificationSource`
- Import and wire `useEngagementNotifications`
- Add tab with `Activity` icon for engagement notifications
- Add icon/color maps for engagement notification types
- Normalize engagement notifications into `UnifiedNotification` format with `navigateTo` from `action_path`

#### 5. Add i18n keys

**Files**: `src/locales/en.json`, `src/locales/ar.json`

- Notification type titles: `notifications.type.engagement_drop`, `notifications.type.appreciation_reminder`, etc.
- Body translations for each type
- Tab label: `notifications.engagement`

#### 6. Schedule the notifier via pg_cron

**Insert (not migration)**: Schedule `engagement-notifier` to run daily at 08:00 UTC.

### Notification Types & Targeting

| Type | Target | Trigger | Action Path |
|------|--------|---------|-------------|
| `engagement_drop` | Employee | Personal score drops below 35 | `/employee/survey` |
| `appreciation_reminder` | Employee | No appreciations sent in 14 days | Home (appreciation widget) |
| `pulse_nudge` | Employee | No check-in in 7 days | `/employee/survey` |
| `manager_team_alert` | Manager | Any direct report score < 40 | `/engagement-insights` |
| `action_followup` | Employee | CTA logged but no follow-through in 3 days | From original `actionPath` |

### Anti-Spam Rules (enforced in edge function)

- Max 2 engagement notifications per employee per day
- 48h cooldown per notification type per recipient
- No duplicate notifications for same trigger within cooldown

### Files Summary

| File | Action |
|------|--------|
| Migration | Create `engagement_notifications` table + RLS + trigger + realtime |
| `supabase/functions/engagement-notifier/index.ts` | Create scheduled notifier |
| `src/features/team-pulse/hooks/useEngagementNotifications.ts` | Create notification hook |
| `src/components/notifications/UnifiedNotificationBell.tsx` | Add engagement tab |
| `src/locales/en.json` | Add i18n keys |
| `src/locales/ar.json` | Add i18n keys |

### What Is Not Changing

- Existing task/crisis/recognition notification flows unchanged
- No changes to `team-pulse-engine` edge function
- No changes to existing dashboard components
- Push notification bridge in `useTaskNotifications` pattern will be replicated for engagement

