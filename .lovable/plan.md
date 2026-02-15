

# Fix: Schedule Engine Insert Failure

## Root Cause

The schedule engine finds the questions successfully (5 wellness questions), but the **insert into `scheduled_questions` fails** because the code includes `branch_id` and `site_id` columns that do not exist on the table.

The error from the logs:
```
Could not find the 'branch_id' column of 'scheduled_questions' in the schema cache
```

The `scheduled_questions` table only has these columns:
`id, schedule_id, employee_id, question_id, tenant_id, scheduled_delivery, actual_delivery, status, delivery_channel, reminder_count, created_at`

## Fix (2 steps)

### Step 1: Update the Edge Function

Remove `branch_id` and `site_id` from the insert payload in `supabase/functions/schedule-engine/index.ts`. The current code on line ~180 builds objects with these non-existent columns:

```typescript
// BEFORE (broken)
scheduledQuestions.push({
  schedule_id: schedule.id,
  employee_id: employee.id,
  question_id: question.id,
  tenant_id: schedule.tenant_id,
  branch_id: schedule.branch_id || null,   // <-- does not exist
  site_id: schedule.site_id || null,        // <-- does not exist
  scheduled_delivery: deliveryDate.toISOString(),
  status: "pending",
  delivery_channel: "app",
});

// AFTER (fixed)
scheduledQuestions.push({
  schedule_id: schedule.id,
  employee_id: employee.id,
  question_id: question.id,
  tenant_id: schedule.tenant_id,
  scheduled_delivery: deliveryDate.toISOString(),
  status: "pending",
  delivery_channel: "app",
});
```

### Step 2: Redeploy the Edge Function

Deploy the updated `schedule-engine` function so the fix takes effect.

---

## Why This is Scalable

- No database migration needed -- the fix is purely removing invalid columns from the insert
- The employee scoping by `branch_id` / `site_id` still works correctly in the employee query (employees table has those columns)
- If branch/site tracking is needed on `scheduled_questions` in the future, a migration can add those columns at that time

