

# Fix: Action Creation Fails Due to Status Mismatch

## Root Cause

The `sync_action_to_queue` trigger copies the action's `status` directly into `task_queue_items`. However, `objective_actions` uses statuses like `planned` and `scheduled`, while `task_queue_items` has a validation trigger (`validate_queue_item_status`) that only allows: `pending`, `in_progress`, `completed`, `blocked`, `cancelled`.

When you create an action with status `planned`, the trigger tries to insert `planned` into `task_queue_items` → validation fails → entire transaction rolls back.

## Fix

**Database migration** to update the `sync_action_to_queue` function to map action statuses to valid queue statuses:

| Action Status | Queue Status |
|---|---|
| `planned` | `pending` |
| `scheduled` | `pending` |
| `in_progress` | `in_progress` |
| `completed` | `completed` |
| `blocked` | `blocked` |
| anything else | `pending` |

The fix is a single `CREATE OR REPLACE FUNCTION` for `sync_action_to_queue` that adds a status mapping variable before inserting/updating `task_queue_items`.

No frontend changes needed.

