

# Add Test Tasks via Database Seed

## What

Insert test tasks directly into `unified_tasks` covering different statuses, priorities, and due dates to exercise the representative task system end-to-end.

## Test Tasks (6 tasks across 3 employees)

All tasks use:
- `tenant_id`: `4fc9029e-2485-46a5-a540-ec2de643c3e3`
- `source_type`: `representative_assigned`
- `created_by`: `276100d6-b28d-491b-9c6e-e54cb3cd306d` (LUAY — the representative)
- Single `source_id` batch UUID for grouping

| # | Employee | Title | Status | Priority | Due Date | Est. Min |
|---|----------|-------|--------|----------|----------|----------|
| 1 | LUAY (c90bf2da) | Review Q2 compliance report | `open` | 1 (high) | +3 days | 120 |
| 2 | LUAY (c90bf2da) | Update safety protocols | `in_progress` | 2 | +7 days | 90 |
| 3 | Test User (61170e42) | Prepare training materials | `open` | 3 (medium) | +5 days | 60 |
| 4 | Test User (61170e42) | Submit incident report | `draft` | 1 | +2 days | 30 |
| 5 | Abdullah (6bf750db) | Conduct site inspection | `open` | 2 | +10 days | 180 |
| 6 | Abdullah (6bf750db) | Complete HSE audit checklist | `in_progress` | 1 | +1 day (approaching deadline) | 240 |

## Implementation

Single SQL migration that:
1. Generates a shared `source_id` batch UUID
2. Inserts 6 rows into `unified_tasks` with valid statuses (`draft`, `open`, `in_progress`)
3. Sets `is_locked = true` and `locked_by` for representative-assigned tasks
4. All tasks include `department_id` from the employee records

This covers testing:
- **Status lifecycle**: draft, open, in_progress
- **Priority levels**: 1 (high), 2, 3 (medium)
- **Due date scenarios**: approaching (1 day), normal (3-10 days)
- **Multiple employees** across the representative's scope
- **Batch grouping** via shared `source_id`

## Files
- 1 new migration file (SQL INSERT)

