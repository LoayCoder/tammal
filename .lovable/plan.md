

## VIP To-Do System — Full Enhancement Plan

### Overview
Address 8 gaps: due time support, sidebar nav, dashboard widget, reminder/notification system, overdue handling, calendar integration, and task editing UI.

---

### 1. Database Migration

Add columns to `personal_todos`:
- `due_time TIME` — optional time component
- `reminder_offset INTEGER` — minutes before due (null = no reminder, 15/60/1440 etc.)
- `reminder_sent BOOLEAN DEFAULT false` — prevents duplicate notifications
- `description TEXT` — optional notes

---

### 2. Hook Updates (`usePersonalTodos.ts`)

- Update `PersonalTodo` interface with `due_time`, `reminder_offset`, `reminder_sent`, `description`
- Update `createTodo` mutation to accept `due_time` and `reminder_offset`
- Update `updateTodo` to support all new fields
- Enhance `parseSmartInput` to detect time patterns (e.g., "at 5pm", "at 14:00")

---

### 3. Reminder System (`useTodoReminders.ts`)

New hook that:
- Polls pending todos with `due_date + due_time` and `reminder_offset` set, `reminder_sent = false`
- Compares `now >= due_datetime - offset_minutes`
- Fires browser push notification via existing `usePushNotifications` hook
- Marks `reminder_sent = true` in DB
- Also fires for overdue tasks (past due with no completion)
- Runs on a 60-second interval via `setInterval`

---

### 4. VipTodoView UI Enhancements

**4a. Task Creation Dialog**
- Replace inline-only input with an expandable creation form (still minimal)
- Fields: title (required), due date (date picker), due time (time input), priority (dot selector), reminder (dropdown: None / 15 min / 1 hour / 1 day / Custom)
- Quick-add via Enter still works for fast input; expand icon reveals full form

**4b. Task Edit Sheet**
- Click on a task row opens a minimal bottom sheet / dialog
- Edit title, due date, due time, priority, reminder offset
- Delete action

**4c. Overdue Indicator**
- Red dot + "Overdue" label for tasks past due date+time
- Auto-sort overdue tasks to top of list

**4d. Time Display**
- Show `due_time` next to due date: "Today 5:00 PM" or "Apr 12 · 2:30 PM"

---

### 5. Sidebar Navigation (`AppSidebar.tsx`)

Add To-Do List entry under Workload Intelligence group, after "My Workload":
```
{ title: t('nav.todoList', 'To-Do List'), url: "/my-workload?tab=todo", icon: Sparkles, access: 'employee' }
```
This navigates to My Workload with the todo tab pre-selected.

Alternatively, create a standalone `/todo` route for dedicated access.

---

### 6. Dashboard Widget (`DashboardTodoWidget.tsx`)

New widget for `EmployeeHome.tsx`:
- Shows today's personal todos (max 5)
- Progress bar: "3/7 completed today"
- Quick-add input inline
- "Tasks Needing Attention" section: overdue todos with red indicator
- Link to full To-Do view
- Placed after Workload Widget in dashboard hierarchy

---

### 7. Calendar Integration (`WorkloadCalendarView.tsx`)

- Fetch personal todos alongside unified tasks
- Display todos as calendar events (distinct color/style — dotted border or sparkle icon)
- Show `due_time` on calendar cells
- Click navigates to todo edit

---

### 8. Standalone Route (Optional Enhancement)

Create `/todo` page that renders `VipTodoView` with full-page layout including `PageHeader`. This gives sidebar navigation a clean dedicated URL instead of a query-param hack.

---

### Files to Create
1. **Migration SQL** — add `due_time`, `reminder_offset`, `reminder_sent`, `description` columns
2. **`src/features/workload/hooks/useTodoReminders.ts`** — reminder polling + push notification logic
3. **`src/components/dashboard/DashboardTodoWidget.tsx`** — dashboard widget
4. **`src/features/workload/components/TodoCreateDialog.tsx`** — expanded creation form
5. **`src/features/workload/components/TodoEditSheet.tsx`** — edit sheet for existing todos
6. **`src/pages/employee/TodoPage.tsx`** — standalone `/todo` route

### Files to Modify
1. **`src/features/workload/hooks/usePersonalTodos.ts`** — new fields, time parsing
2. **`src/features/workload/components/VipTodoView.tsx`** — edit/create UI, overdue handling, time display
3. **`src/components/layout/AppSidebar.tsx`** — add To-Do nav item
4. **`src/pages/EmployeeHome.tsx`** — add `DashboardTodoWidget`
5. **`src/features/workload/components/WorkloadCalendarView.tsx`** — render todos on calendar
6. **`src/App.tsx`** — add `/todo` route
7. **`src/pages/employee/PersonalCommandCenter.tsx`** — read `?tab=todo` query param for deep linking

