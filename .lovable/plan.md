

# Admin Monitoring & Support System for Survey Process

## Overview

This plan implements a comprehensive admin framework for monitoring published surveys, handling user support tickets, tracking survey interactions, sending notifications/escalations, and enforcing data privacy -- all integrated into the existing survey pipeline.

The implementation is split into **5 phases** matching the 5 requirement areas, delivered as incremental work.

---

## Phase 1: Survey Monitoring Dashboard

### What It Does
A new admin page at `/admin/survey-monitor` that shows real-time progress of all published (active) surveys. Admins can select a survey and see participation stats, status breakdowns, department heatmaps, and timeline trends.

### Database Changes
- **New table: `survey_monitor_snapshots`** -- Stores periodic aggregated participation data for trend-over-time charts (tenant_id, schedule_id, snapshot_date, stats JSONB). RLS: super_admin ALL, tenant_admin read/write for own tenant.

No other new tables needed -- participation data is already derivable from `scheduled_questions` (status field: pending, delivered, answered, skipped, expired, failed) and `employee_responses` (is_draft, deleted_at).

### New Components
- `src/pages/admin/SurveyMonitor.tsx` -- Main page with survey selector and dashboard tabs
- `src/components/survey-monitor/ParticipationOverview.tsx` -- Cards: Total Targeted, Not Started, In Progress (draft), Completed, Expired, overall completion %
- `src/components/survey-monitor/DepartmentHeatmap.tsx` -- Color-coded participation rate by department/branch (reuses existing org structure queries)
- `src/components/survey-monitor/ParticipationTrend.tsx` -- Line chart showing completion rate over the survey window (uses snapshot data)
- `src/components/survey-monitor/SLAIndicator.tsx` -- Shows start/end time window, time remaining, warning if nearing deadline
- `src/components/survey-monitor/RiskPanel.tsx` -- Highlights departments/branches with participation below a configurable threshold

### New Hook
- `src/hooks/analytics/useSurveyMonitor.ts` -- Fetches and computes stats from `scheduled_questions` + `employee_responses` for a given schedule_id

### Route & Sidebar
- Route: `/admin/survey-monitor` wrapped in `AdminRoute`
- Sidebar: Added under "Survey System" group with a BarChart3 icon

### Status Mapping
```text
Not Started  = scheduled_questions.status = 'pending' AND no employee_response exists
In Progress  = employee_responses.is_draft = true (draft saved)
Completed    = scheduled_questions.status = 'answered'
Expired      = scheduled_questions.status = 'expired'
```

---

## Phase 2: Support Ticketing System

### What It Does
A ticket system where employees can report survey-related issues, and admins can track, assign, and resolve them.

### Database Changes

**New table: `support_tickets`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | RLS isolation |
| reporter_user_id | uuid | Who filed |
| schedule_id | uuid | nullable, links to survey |
| assigned_to | uuid | nullable, support owner |
| priority | text | low/medium/high/critical |
| status | text | open/in_review/resolved/closed |
| subject | text | Title |
| description | text | Body |
| category | text | technical/clarification/access/other |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| resolved_at | timestamptz | nullable |
| deleted_at | timestamptz | Soft delete |

RLS: super_admin ALL, tenant_admin ALL for own tenant, users can INSERT + SELECT own tickets.

**New table: `support_ticket_comments`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| ticket_id | uuid | FK to support_tickets |
| user_id | uuid | commenter |
| tenant_id | uuid | RLS |
| message | text | |
| is_internal | boolean | Admin-only note |
| created_at | timestamptz | |

RLS: super_admin ALL, tenant_admin ALL for own tenant, users can read non-internal comments on own tickets + insert comments on own tickets.

### Audit Integration
All status changes on support_tickets are logged to `audit_logs` using the existing `useAuditLog` hook.

### New Components
- `src/pages/admin/SurveySupport.tsx` -- Admin view: ticket table with filters (status, priority, survey, assignee)
- `src/components/support/TicketTable.tsx` -- Filterable, sortable table
- `src/components/support/TicketDetailDialog.tsx` -- View ticket + comment thread + status controls
- `src/components/support/CreateTicketDialog.tsx` -- Employee-facing form (also accessible from survey page)

### New Hooks
- `src/hooks/support/useSupportTickets.ts` -- CRUD for tickets
- `src/hooks/support/useTicketComments.ts` -- CRUD for comments

### Routes
- `/admin/survey-support` -- Admin ticket dashboard (AdminRoute)
- The existing `/support` page will link to "Survey Issues" section

---

## Phase 3: Survey Interaction Oversight

### What It Does
Adds an "Interactions" tab to the Survey Monitor dashboard showing individual-level activity patterns (without revealing answers when anonymity is required).

### Components
- `src/components/survey-monitor/InteractionOversight.tsx` -- Table showing:
  - Users who saved draft but did not complete (filter: `is_draft = true` + no final submission)
  - Users who were assigned but never opened (status = 'delivered', no response at all)
  - Technical errors (status = 'failed')
- `src/components/survey-monitor/ExtensionRequests.tsx` -- Simple list if extension requests exist (stored as support tickets with category = 'extension_request')

### Data Source
All data comes from existing `scheduled_questions` + `employee_responses` tables -- no new tables needed.

### Privacy Guard
When anonymity is enabled on a survey, the interaction view shows department-level aggregates only, not individual names. This is enforced in the hook by checking a new `anonymity_enabled` boolean on `question_schedules`.

### Database Change
- Add column `anonymity_enabled` (boolean, default false) to `question_schedules` table.

---

## Phase 4: Notifications & Escalation

### What It Does
Automated and manual notification capabilities for survey lifecycle events.

### Database Changes

**New table: `survey_notifications`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | RLS |
| schedule_id | uuid | Which survey |
| type | text | reminder/escalation/deadline_warning/error_alert |
| target_user_id | uuid | nullable (null = broadcast) |
| message | text | |
| is_read | boolean | default false |
| created_at | timestamptz | |

RLS: super_admin ALL, tenant_admin manage for own tenant, users can read own notifications.

**New table: `survey_escalation_rules`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| tenant_id | uuid | RLS |
| schedule_id | uuid | nullable (null = global) |
| rule_type | text | low_participation/deadline_approaching/error_threshold |
| threshold_value | integer | e.g. 50 for 50% participation |
| notify_role | text | tenant_admin/manager |
| is_active | boolean | |
| created_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

### Edge Function
- `supabase/functions/survey-notifications/index.ts` -- Scheduled via pg_cron, runs every hour:
  1. Checks active surveys against escalation rules
  2. Sends reminders to employees who haven't responded
  3. Creates escalation alerts if participation below threshold
  4. Warns if survey nearing deadline (configurable hours before end)
  5. Alerts on error counts exceeding threshold

### UI Components
- `src/components/survey-monitor/NotificationCenter.tsx` -- Bell icon + dropdown in monitor page
- `src/components/survey-monitor/EscalationRulesDialog.tsx` -- CRUD for rules per survey
- `src/components/survey-monitor/SendReminderDialog.tsx` -- Manual reminder to specific employees/departments

---

## Phase 5: Data Integrity & Compliance

### What It Does
Enforces privacy controls across the monitoring system.

### Implementation (Code-Level Guards)
- **Anonymity check**: When `question_schedules.anonymity_enabled = true`, the Survey Monitor hook strips employee names and returns only aggregated department-level data. Individual response content is never returned.
- **RBAC enforcement**: All new pages use `AdminRoute` + `PermissionGate`. New permission codes:
  - `survey.monitor` -- View survey monitoring dashboard
  - `survey.support.manage` -- Manage support tickets
  - `survey.notifications.manage` -- Configure escalation rules
  - `survey.interactions.view` -- View interaction oversight
- **Aggregated-only mode**: A toggle in the monitor that forces all views into aggregate mode regardless of anonymity setting (for compliance-conscious admins).
- **Audit trail**: All admin actions (sending reminders, changing ticket status, viewing interaction data) are logged via `useAuditLog`.

### Database Changes
- Insert 4 new permission rows into the `permissions` table (seeded via migration).

---

## Technical Summary

### New Database Tables (4)
1. `survey_monitor_snapshots` -- Trend data
2. `support_tickets` -- Ticketing
3. `support_ticket_comments` -- Ticket thread
4. `survey_notifications` -- In-app notifications
5. `survey_escalation_rules` -- Automation rules

### Modified Tables (2)
1. `question_schedules` -- Add `anonymity_enabled` column
2. `permissions` -- Insert 4 new permission rows

### New Edge Function (1)
- `survey-notifications` -- Scheduled notification engine

### New Pages (2)
- `/admin/survey-monitor` -- Monitoring dashboard
- `/admin/survey-support` -- Support ticket management

### New Hooks (5)
- `useSurveyMonitor`
- `useSupportTickets`
- `useTicketComments`
- `useSurveyNotifications`
- `useEscalationRules`

### New Components (~12)
Spread across `src/components/survey-monitor/` and `src/components/support/`

### Localization
All new UI strings added to both `en.json` and `ar.json` using logical properties (me-, ms-, text-start, etc.) per the Dhuud RTL protocol.

### Implementation Order
Phase 1 (Monitor) -> Phase 2 (Support) -> Phase 3 (Interactions) -> Phase 4 (Notifications) -> Phase 5 (Compliance) -- each phase is independently functional.

