

## VIP To-Do List — Personal Task Command Center

### Overview
Add a new "To-Do" tab to the existing **My Workload** (`/my-workload`) page, providing a lightweight personal task experience separate from formal workload tasks. Uses a new `personal_todos` database table for quick, informal tasks with smart input parsing and AI daily planning.

### Architecture

```text
PersonalCommandCenter (existing)
  └─ ViewType: 'tasks' | 'calendar' | 'approvals' | 'todo'  ← NEW TAB
       └─ VipTodoView (new component)
            ├─ SmartTodoInput (inline quick-add with NLP parsing)
            ├─ FocusTaskBanner (top priority highlight)
            ├─ TodoProgressBar ("3/7 completed today")
            ├─ TodoList (minimal rows, inline complete/delete)
            └─ AIDailyTip (one-line AI suggestion)
```

### Database

**New table: `personal_todos`**
- `id` UUID PK
- `tenant_id` UUID NOT NULL (RLS)
- `employee_id` UUID NOT NULL → employees
- `title` TEXT NOT NULL
- `is_completed` BOOLEAN DEFAULT false
- `completed_at` TIMESTAMPTZ NULL
- `priority` INTEGER DEFAULT 3 (1=critical → 4=low)
- `due_date` DATE NULL
- `linked_task_id` UUID NULL → unified_tasks (optional link)
- `sort_order` INTEGER DEFAULT 0
- `created_at`, `updated_at`, `deleted_at` (standard)

RLS: tenant isolation via `current_tenant_id()`. Soft delete standard.

### Files to Create

**1. Migration** — `personal_todos` table with RLS policies, indexes

**2. `src/features/workload/hooks/usePersonalTodos.ts`**
- CRUD hook: `usePersonalTodos(employeeId)`
- Returns `todos`, `createTodo`, `toggleComplete`, `deleteTodo`, `reorderTodo`
- Queries `personal_todos` filtered by employee, ordered by `is_completed ASC, sort_order ASC, due_date ASC`

**3. `src/features/workload/components/VipTodoView.tsx`**
Main container with:
- **SmartTodoInput**: Single input with sparkle icon, placeholder "What do you need to do today?". On Enter, parses:
  - "tomorrow" / "today" → sets `due_date`
  - "urgent" / "critical" → sets `priority` 1
  - "high" → priority 2
- **FocusTaskBanner**: Highlights top uncompleted task (lowest priority number + earliest due) with 🔥 icon, subtle primary/5 background
- **TodoProgressBar**: "3 / 7 completed today" with thin progress bar
- **Todo items**: Minimal rows — checkbox, title, due date chip, priority dot. Click checkbox to toggle. Swipe-like delete via dropdown. Smooth `opacity-50 line-through` on complete with 200ms transition
- **AIDailyTip**: Uses existing Lovable AI (gemini-2.5-flash-lite) via edge function to generate a one-line daily planning suggestion based on task count/priorities. Cached per day. Dismissible.
- **Convert to Workload**: Menu action on each todo to promote it to a `unified_tasks` entry

**4. `src/features/workload/components/AIDailyTip.tsx`**
- Calls edge function `todo-daily-tip` with employee's todo summary
- Displays as a subtle top banner: "💡 You have 5 tasks. Start with your critical items first."
- Cached in localStorage per day to avoid repeat calls

**5. `supabase/functions/todo-daily-tip/index.ts`**
- Receives `{ todoCount, criticalCount, completedCount, employeeName }`
- Calls Lovable AI (gemini-2.5-flash-lite) for a one-line motivational planning tip
- Returns `{ tip: string }`

### Files to Modify

**6. `src/pages/employee/PersonalCommandCenter.tsx`**
- Add `'todo'` to `ViewType`
- Add new ToggleGroupItem for To-Do tab with `Sparkles` icon
- Render `<VipTodoView>` when `view === 'todo'`

**7. `src/features/workload/index.ts`**
- Export `usePersonalTodos` and `VipTodoView`

### Design Rules (Premium VIP)
- No card wrappers around todo items — flat rows with `hover:bg-muted/10`
- Priority shown as small colored dots (same as `UnifiedTaskList`)
- Due dates as subtle chips (`text-2xs text-muted-foreground`)
- Focus task gets a soft `bg-primary/5 rounded-xl` highlight
- 44px min touch targets, `active:scale-[0.97]` feedback
- Completion animation: checkbox scales up briefly, row fades to 50% opacity
- Empty state: centered illustration-free message with sparkle icon

### Technical Details
- Input NLP is client-side regex (no AI needed for parsing)
- AI tip is optional/progressive — page works fully without it
- Reorder via `sort_order` field, updated on drag (future enhancement)
- All queries include `deleted_at IS NULL` and tenant isolation

