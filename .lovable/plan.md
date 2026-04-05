

## Fix Notification Arabic Support, Survey Card Localization, and Remove Toolkit Sections

### Problem Summary
1. **Notification content** (titles like "New task assigned:", "New support case assigned") is hardcoded English in DB triggers — not translatable
2. **Notification timestamps** ("27 days ago") render in English even in Arabic mode
3. **Survey card** has hardcoded English date format and "Xd left" string
4. **MentalHealthToolsHub** and **MentalHealthResourcesHub** still on dashboard — should be removed (moved to Wellness Hub)

### Plan

#### 1. Translate notification content on the frontend (`UnifiedNotificationBell.tsx`)

Since notification titles/bodies are stored in English by DB triggers, we translate them client-side using a type-based mapping:

- Create a `getTranslatedTitle(n, t)` helper that maps notification `type` to translation keys
- For **task** notifications: extract the task name from the English title (after the colon) and pass it as interpolation
- For **crisis** notifications: map types like `case_assigned`, `new_message`, etc.
- For **recognition** notifications: map `endorsement_requested`, `nomination_endorsed`, etc.
- Similarly create `getTranslatedBody(n, t)` for body text
- Replace raw `{n.title}` and `{n.body}` with the translated versions

**New translation keys** in both `en.json` and `ar.json` under `notifications`:

| Key | English | Arabic |
|-----|---------|--------|
| `notifications.type.assigned` | `New task assigned: {{name}}` | `تم تعيين مهمة جديدة: {{name}}` |
| `notifications.type.status_changed` | `Task status changed: {{name}}` | `تغيرت حالة المهمة: {{name}}` |
| `notifications.type.approved` | `Task approved: {{name}}` | `تمت الموافقة على المهمة: {{name}}` |
| `notifications.type.rejected` | `Task rejected: {{name}}` | `تم رفض المهمة: {{name}}` |
| `notifications.type.approval_requested` | `Review requested: {{name}}` | `مطلوب مراجعة: {{name}}` |
| `notifications.type.overdue` | `Task overdue: {{name}}` | `مهمة متأخرة: {{name}}` |
| `notifications.type.deadline_approaching` | `Deadline approaching: {{name}}` | `اقتراب الموعد النهائي: {{name}}` |
| `notifications.type.comment_added` | `New comment on: {{name}}` | `تعليق جديد على: {{name}}` |
| `notifications.type.checklist_completed` | `Checklist completed: {{name}}` | `اكتملت قائمة المهام: {{name}}` |
| `notifications.type.case_assigned` | `New support case assigned` | `تم تعيين حالة دعم جديدة` |
| `notifications.type.new_message` | `New message` | `رسالة جديدة` |
| `notifications.type.case_resolved` | `Case resolved` | `تم حل الحالة` |
| `notifications.type.endorsement_requested` | `Endorsement requested` | `طُلب تأييدك` |
| `notifications.type.nomination_endorsed` | `Nomination endorsed` | `تم تأييد الترشيح` |
| `notifications.body.assigned` | `You have been assigned a new task.` | `تم تعيين مهمة جديدة لك.` |
| `notifications.body.approved` | `Your task has been approved.` | `تمت الموافقة على مهمتك.` |
| `notifications.body.rejected` | `Your task has been rejected.` | `تم رفض مهمتك.` |
| (+ remaining body keys) | | |

#### 2. Localize notification timestamps (`UnifiedNotificationBell.tsx`)

- Import `ar` locale from `date-fns/locale/ar` and `enUS` from `date-fns/locale/en-US`
- Use `useTranslation` to detect language
- Pass locale to `formatDistanceToNow`: `formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })`

#### 3. Fix survey card date and countdown (`EmployeeHome.tsx`)

- Import `ar` and `enUS` date-fns locales
- Pass locale to `format()` on line 157
- Replace hardcoded `` `${daysLeft}d left` `` with `t('home.daysLeft', { days: daysLeft })`
- Add `home.daysLeft` key: EN `"{{days}}d left"` / AR `"متبقي {{days}} يوم"`

#### 4. Remove toolkit sections from dashboard (`EmployeeHome.tsx`)

- Remove `MentalHealthToolsHub` and `MentalHealthResourcesHub` imports (lines 13-14)
- Remove their JSX (lines 198-202)

### Files Modified

| File | Change |
|------|--------|
| `src/components/notifications/UnifiedNotificationBell.tsx` | Add translation helpers for title/body, localize timestamps |
| `src/pages/EmployeeHome.tsx` | Fix date locale, translate "d left", remove toolkit sections |
| `src/locales/en.json` | Add notification type/body keys + `home.daysLeft` |
| `src/locales/ar.json` | Add notification type/body keys + `home.daysLeft` |

