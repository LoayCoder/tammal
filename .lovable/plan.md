

# Wellness & Question Management Enhancement Plan

## Current State Analysis

The platform already has a robust survey system:
- AI Question Generator with advanced settings (models, frameworks, knowledge base, validation, accuracy modes)
- Schedule Management with multi-schedule support
- Schedule Engine and Delivery edge functions
- Employee Survey portal with response submission

The SRS describes 4 new modules that add a **Wellness layer** on top of the existing system. This plan integrates them logically without duplicating or breaking existing functionality.

---

## Architecture Overview

The new wellness system runs alongside the existing survey system as a separate "daily check-in" experience with its own tables, while reusing shared infrastructure (auth, tenants, employees, AI gateway).

```text
Existing System                    New Wellness System
+-----------------------+          +-----------------------+
| questions             |          | wellness_questions    |
| question_schedules    |          | question_schedule_    |
| scheduled_questions   |          |   settings (1 row)    |
| employee_responses    |          | daily_question_       |
| AI Generator Page     |          |   schedule            |
| Schedule Mgmt Page    |          | mood_entries          |
| Employee Survey Page  |          | question_generation_  |
+-----------------------+          |   batches             |
        |                          | Daily Check-in Page   |
        |                          | Batch Mgmt Page       |
        +-------- shared ----------+ Schedule Settings Page|
          employees, tenants,       | AI Wellness Gen EF   |
          auth, AI gateway          +-----------------------+
```

---

## Phase 1: Database Schema (Migration)

Create 5 new tables:

### 1. `wellness_questions`
Bilingual wellness question pool, organized by batch.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | RLS isolation |
| batch_id | uuid FK | Links to generation batch |
| question_text_en | text | English text |
| question_text_ar | text | Arabic text |
| question_type | text | scale, multiple_choice, text |
| options | jsonb | Array of option strings |
| status | text | draft, published, archived |
| created_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

### 2. `question_schedule_settings`
Single-row per tenant configuration for wellness delivery.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid UNIQUE | One row per tenant |
| delivery_time | time | HH:MM format |
| active_days | jsonb | Array of day numbers [0-6] |
| questions_per_day | integer | Default 1 |
| workdays_only | boolean | Default true |
| is_active | boolean | Default true |
| updated_at | timestamptz | |

### 3. `daily_question_schedule`
Maps a wellness question to a specific date for delivery.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | |
| question_id | uuid FK | -> wellness_questions |
| scheduled_date | date | The calendar date |
| status | text | pending, delivered, completed |
| created_at | timestamptz | |

### 4. `mood_entries`
Stores daily mood check-in responses from employees.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | |
| employee_id | uuid FK | -> employees |
| mood_level | text | great, good, okay, struggling, need_help |
| mood_score | integer | 5,4,3,2,1 numeric mapping |
| question_id | uuid FK | -> wellness_questions |
| answer_value | jsonb | The answer to the daily question |
| answer_text | text | Optional comment |
| ai_tip | text | AI-generated wellness tip |
| support_actions | jsonb | Selected support actions |
| points_earned | integer | Gamification points |
| streak_count | integer | Consecutive days |
| entry_date | date | Date of the entry |
| created_at | timestamptz | |

### 5. `question_generation_batches`
Manages AI-generated wellness question batches by month.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tenant_id | uuid | |
| target_month | date | First day of target month |
| question_count | integer | Number of questions in batch |
| status | text | draft, reviewing, published, archived |
| created_by | uuid | |
| created_at | timestamptz | |
| published_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

All tables get RLS policies following the existing pattern:
- Super admins: full access
- Tenant admins: manage their tenant's data
- Employees: read/write their own mood entries

---

## Phase 2: Edge Functions (3 New)

### 1. `auto-schedule-questions`
Called when daily check-in finds no schedule for today (PGRST116 fallback).

- Input: `{ tenantId, date }`
- Logic: Fetch published `wellness_questions`, pick one randomly (avoiding repeats in last 14 days), insert into `daily_question_schedule`
- Returns the newly created schedule row

### 2. `generate-daily-tip`
Called after mood submission to generate a personalized AI wellness tip.

- Input: `{ moodLevel, questionText, answerValue }`
- Uses Lovable AI Gateway with `google/gemini-3-flash-preview`
- System prompt: "You are a workplace wellness coach. Generate a brief, actionable wellness tip based on the employee's mood and response."
- Returns `{ tip: string }`

### 3. `create-batch-schedules`
Called from Batch Management to map a batch of questions to calendar days.

- Input: `{ batchId }`
- Logic:
  1. Fetch batch details (target month)
  2. Fetch tenant's `question_schedule_settings` (active days, workdays_only)
  3. Fetch all questions in the batch
  4. Calculate valid days in the target month
  5. **Delete existing** `daily_question_schedule` records for that month (conflict resolution)
  6. Round-robin assign questions to valid days
  7. Insert new schedule records

---

## Phase 3: Frontend Hooks (4 New)

### 1. `useDailyWellnessQuestions`
- **Cache-first**: Check `localStorage` key `daily-questions:{lang}:{date}`
- If cache miss: query `daily_question_schedule` for today
- If PGRST116: invoke `auto-schedule-questions`, retry fetch
- Returns localized question based on `i18n.language`

### 2. `useWellnessScheduleSettings`
- Fetches single-row from `question_schedule_settings` using `.limit(1).maybeSingle()`
- Mutation: upsert settings, invalidate `['schedule-settings']`
- Zod validation for `active_days` (array of 0-6) and `delivery_time` (HH:MM)

### 3. `useQuestionBatchManagement`
- CRUD for `question_generation_batches` + related `wellness_questions`
- `bulkPublish`: updates batch status + all child questions to "published"
- `createSchedules`: invokes `create-batch-schedules` edge function

### 4. `useGamification`
- Calculates streak from consecutive `mood_entries` dates
- Awards points: base 10 + streak bonus (5 per day, capped at 50)
- Returns `{ points, streak, totalPoints }`

---

## Phase 4: Frontend Pages (3 New, 1 Updated)

### 1. Daily Check-in Page (`/employee/wellness`)
- Mood selector: 5 buttons (Great, Good, Okay, Struggling, Need Help) with emoji icons
- Daily wellness question rendered below mood selector
- Dynamic "Support Actions" section (appears for Struggling/Need Help): Meditation, Breathing, Talk to Someone, Take a Break
- On submit: call `generate-daily-tip` -> store `mood_entries` -> award points -> confetti animation
- Shows streak counter and points earned
- Uses `useDailyWellnessQuestions` for cache-first loading

### 2. Admin Schedule Settings Page (`/admin/wellness-settings`)
- Single form (not a table) since it's a one-row config
- Fields: delivery time (time picker), active days (multi-checkbox), questions per day, workdays only toggle
- Zod-validated form with react-hook-form
- Save button invalidates schedule settings query

### 3. Batch Management Page (`/admin/wellness-batches`)
- Table showing all batches: target month, count, status, actions
- "Generate New Batch" button -> dialog to select month + count -> invokes `ai-generate-wellness-pool`
- Row actions: Review (view questions), Publish (bulk status update), Schedule (map to calendar), Delete (soft)
- Expandable rows to preview questions in the batch

### 4. Updated Sidebar
- New "Wellness" group in sidebar with 3 items:
  - Daily Check-in -> `/employee/wellness`
  - Batch Management -> `/admin/wellness-batches`
  - Wellness Settings -> `/admin/wellness-settings`

---

## Phase 5: Localization

Add all new i18n keys to both `en.json` and `ar.json` under a `wellness` namespace:
- `wellness.dailyCheckin`, `wellness.howAreYou`, `wellness.moodGreat`, etc.
- `wellness.batchManagement`, `wellness.generateBatch`, etc.
- `wellness.settings`, `wellness.deliveryTime`, `wellness.activeDays`, etc.

---

## What Is Preserved (No Changes)

- **AI Question Generator**: All advanced settings, config panel, knowledge base, frameworks, validation -- completely untouched
- **Existing Schedule Management**: `question_schedules` table and page remain for the survey system
- **Employee Survey**: Existing survey portal remains separate from wellness check-in
- **All edge functions**: generate-questions, validate-questions, rewrite-prompt, schedule-engine, deliver-questions, submit-response -- no modifications

---

## Technical Details

### Model Selection
- The wellness AI generation edge function uses `google/gemini-3-flash-preview` as default (matching the updated platform standard)
- Uses Tool Calling for strict JSON output matching `wellness_questions` schema
- The `generate-daily-tip` function uses the same model for quick tip generation (non-streaming)

### Caching Strategy
```text
localStorage key: daily-questions:{lang}:{YYYY-MM-DD}
Value: { question_id, question_text, question_type, options, cached_at }
TTL: expires at midnight (date-based key naturally invalidates)
```

### Gamification Points
```text
Base submission: 10 points
Streak bonus: 5 points per consecutive day (capped at 50)
Example: Day 5 streak = 10 + 25 = 35 points
```

### File Summary

| Category | Files | Count |
|----------|-------|-------|
| Migration | 1 SQL migration (5 tables + RLS) | 1 |
| Edge Functions | auto-schedule-questions, generate-daily-tip, create-batch-schedules | 3 |
| Hooks | useDailyWellnessQuestions, useWellnessScheduleSettings, useQuestionBatchManagement, useGamification | 4 |
| Pages | DailyCheckin, WellnessSettings, BatchManagement | 3 |
| Updated | AppSidebar, App.tsx (routes), en.json, ar.json | 4 |
| Total | | ~15 files |

