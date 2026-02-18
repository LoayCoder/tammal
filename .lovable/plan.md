
# Mood-Specific AI Question Pathways + Intelligent Anti-Duplication Engine

## Current State Assessment

The previous plan proposed a mood-specific AI question system but **none of those files were implemented yet**. What exists today:
- `InlineDailyCheckin.tsx` — the active check-in component (no mood-pathway questions)
- `generate-daily-tip` edge function — generates a post-submission tip only
- `MoodStep.tsx` — renders the mood selector (5 moods: great, good, okay, struggling, need_help)
- No `generate-mood-questions` edge function, no `MoodPathwayQuestions` component, no `mood_question_configs` table, no `MoodPathwaySettings` admin page

This plan implements the full system in one pass, including the anti-duplication engine.

---

## What Gets Built

The daily check-in will gain a new step: after an employee selects a mood, AI generates 1-2 tailored, multiple-choice follow-up questions. The engine guarantees that the same user never sees the same question twice within 14 days, and that themes rotate intelligently. A free-text field appears for extreme moods. Admins can configure the system per mood level.

---

## Database Changes (2 new tables, RLS-compliant)

### Table 1: `mood_question_configs`
Stores per-tenant, per-mood configuration for the AI pathway system.

```sql
CREATE TABLE mood_question_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  mood_level TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  enable_free_text BOOLEAN DEFAULT FALSE,
  custom_prompt_context TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, mood_level)
);
ALTER TABLE mood_question_configs ENABLE ROW LEVEL SECURITY;
-- Tenant admins manage their own configs; super admins manage all
```

### Table 2: `mood_question_history`
Tracks every question shown per user to enforce the 14-day anti-duplication window.

```sql
CREATE TABLE mood_question_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  mood_level TEXT NOT NULL,
  question_hash TEXT NOT NULL,
  theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mood_question_history ENABLE ROW LEVEL SECURITY;
-- Users see own records; tenant admins see tenant records; super admins see all
```

RLS policies follow the existing `has_role` and `get_user_tenant_id` security definer pattern — no inline `auth.users` joins.

---

## New Edge Function: `generate-mood-questions`

**Location:** `supabase/functions/generate-mood-questions/index.ts`

### Input Payload
```json
{
  "moodLevel": "good",
  "moodScore": 4,
  "language": "ar",
  "tenantId": "uuid",
  "userId": "uuid"
}
```

### Processing Pipeline (in order)

**Step 1 — Fetch history (14-day window)**
Query `mood_question_history` for all `(question_hash, theme)` rows where `user_id = $userId AND mood_level = $moodLevel AND created_at > now() - interval '14 days'`. Build `usedHashes: Set<string>` and `usedThemes: Set<string>`.

**Step 2 — Select unused theme**
Each mood level has a defined theme pool. Pick a theme not in `usedThemes`. If all themes exhausted (rare), pick the least-recently used theme.

**Theme pools per mood:**
- `great`: positive_drivers, recognition, team_connection, energy_source, purpose_alignment, momentum_building
- `good`: engagement, collaboration, satisfaction, progress, growth, energy_level
- `okay`: minor_friction, workload_balance, focus_clarity, emotional_energy, support_access
- `struggling`: stressors, burnout_signals, work_life_spillover, communication_gaps, support_needs, work_pressure
- `need_help`: immediate_stress_source, support_preference, human_connection, safety_support

**Step 3 — Fetch tenant config** (from `mood_question_configs`) to check if pathway is enabled, free-text is enabled, and any custom prompt context.

**Step 4 — Build AI prompt** with strict clinical psychologist persona:
```
You are a licensed workplace clinical psychologist specializing in organizational wellbeing.
Generate exactly 1-2 follow-up questions for an employee who reported feeling: {moodLevel}.
Focus theme: {selectedTheme}
Random seed: {crypto.randomUUID()} — use this to vary phrasing.
Previously used themes (avoid semantic similarity): {usedThemes list}

STRICT RULES:
- Question type: multiple_choice with 3-4 options (never more)
- No diagnostic labels (not: depressed, anxious, clinical)
- All options must be normalizing and non-stigmatizing
- Questions must be answerable within 30 seconds
- No assumptions about gender, family, or religion
- For need_help (score 1): ALWAYS include one option: "I'd like to talk to HR or my manager" and one: "I'd prefer professional support"
- Return bilingual output: question_text_en, question_text_ar, options_en[], options_ar[]
- Return field: theme (the theme used)
- Return valid JSON array only, no markdown
```

**Step 5 — Post-generation duplicate check**
For each returned question: compute `SHA-256` of `question_text_en` → compare against `usedHashes`. If any duplicate found → retry (max 2 attempts with a different random seed). If still duplicate after 2 retries → pick next available theme and try once more.

**Step 6 — Safety override for `need_help`**
After all generation: verify the first question always contains the support options. This check runs regardless of theme rotation results and cannot be overridden by retry logic.

**Step 7 — Store to history**
Insert one row per generated question into `mood_question_history`:
```sql
INSERT INTO mood_question_history (tenant_id, user_id, mood_level, question_hash, theme)
VALUES ($tenantId, $userId, $moodLevel, $hash, $theme)
```
Uses service role key for this insert (bypasses RLS since the edge function acts on behalf of the user).

**Step 8 — Return response**
```json
{
  "questions": [
    {
      "question_text_en": "...",
      "question_text_ar": "...",
      "options_en": ["..."],
      "options_ar": ["..."],
      "question_type": "multiple_choice",
      "theme": "engagement",
      "enable_free_text": false
    }
  ]
}
```

---

## New Frontend Component: `MoodPathwayQuestions`

**Location:** `src/components/checkin/MoodPathwayQuestions.tsx`

### Props
```typescript
interface MoodPathwayQuestionsProps {
  moodLevel: string;
  moodScore: number;
  tenantId: string;
  userId: string; // auth user id — NOT employee id
  language: string;
  onAnswersChange: (answers: PathwayAnswer[]) => void;
}
```

### Behavior
1. On mount (when `moodLevel` is set), calls `supabase.functions.invoke('generate-mood-questions', {...})`.
2. Shows a loading skeleton with a subtle animation and `t('moodPathway.generating')` text while waiting.
3. Renders each question as a `RadioGroup` (multiple_choice). Options are shown from `options_ar` or `options_en` based on the current language.
4. For extreme moods (`score === 1 || score === 5`) AND `enable_free_text === true`: appends a `Textarea` below the MCQ with placeholder `t('moodPathway.freeTextPlaceholder')`.
5. A "Skip these questions" ghost link allows dismissal without blocking submission.
6. Questions are cached in component state — no re-fetch on re-render.
7. Results emit `PathwayAnswer[]` upward via `onAnswersChange`.

```typescript
interface PathwayAnswer {
  questionTextEn: string;
  selectedOption: string;
  freeText?: string;
  theme: string;
}
```

---

## Integration into `InlineDailyCheckin`

Three changes to the existing component:

**1. Add `userId` prop**
`InlineDailyCheckin` already receives `employeeId` and `tenantId`. The `userId` (auth user ID) needs to be passed from `EmployeeHome.tsx` via `useCurrentEmployee` (which already returns the full employee record including `user_id`).

**2. Insert `MoodPathwayQuestions` after mood selection**
```tsx
{/* 2. Mood Pathway — AI follow-up after mood selection */}
{selectedMood && moodObj && (
  <MoodPathwayQuestions
    moodLevel={selectedMood}
    moodScore={moodObj.score}
    tenantId={tenantId}
    userId={userId}
    language={i18n.language}
    onAnswersChange={setPathwayAnswers}
  />
)}

{/* 3. Wellness Question — existing */}
```

**3. Enrich submission payload**
In `handleSubmit`, pass `pathwayAnswers` to `generate-daily-tip` for a more personalized tip:
```typescript
const { data } = await supabase.functions.invoke('generate-daily-tip', {
  body: {
    moodLevel: selectedMood,
    questionText: question?.question_text || '',
    answerValue: wellnessAnswer,
    pathwayAnswers, // NEW — enriches tip context
    language: document.documentElement.lang || 'en'
  },
});
```
Also store pathway answers in `mood_entries.answer_value` as a structured JSON:
```json
{
  "wellness": { ...existing },
  "pathway": [ { "theme": "engagement", "answer": "...", "freeText": "..." } ]
}
```

---

## Update `generate-daily-tip` Edge Function

Add `pathwayAnswers` to the prompt context:
```
Employee mood: {moodLevel}
Wellness question: {questionText} → Answer: {answerValue}
Mood pathway reflections:
- Theme: {theme} → Response: {answer}
{freeText if present}
```

---

## New Admin Page: `MoodPathwaySettings`

**Location:** `src/pages/admin/MoodPathwaySettings.tsx`

A settings page accessible at `/admin/mood-pathways` (admin only):
- One card per mood level (great, good, okay, struggling, need_help) with its emoji, label, and color
- Toggle: "Enable AI Follow-up Questions" (maps to `is_enabled`)
- Toggle: "Enable Free-Text Reflection" for extreme moods only (`enable_free_text`, only shown for `great` and `need_help`)
- Optional `Textarea`: "AI Context Hint" (`custom_prompt_context`) — e.g., "Focus on workload and teamwork"
- Save button per card
- If no config exists for the tenant, auto-creates defaults on first visit

### New Hook: `useMoodQuestionConfig`

**Location:** `src/hooks/useMoodQuestionConfig.ts`

Wraps CRUD operations against `mood_question_configs` using React Query. Provides `configs`, `isLoading`, `upsertConfig`.

---

## Routing & Navigation Updates

### `App.tsx`
Add route:
```tsx
import MoodPathwaySettings from "@/pages/admin/MoodPathwaySettings";
// ...
<Route path="/admin/mood-pathways" element={<AdminRoute><MoodPathwaySettings /></AdminRoute>} />
```

### `AppSidebar.tsx`
Add to the wellness group (admin access):
```typescript
{ title: t('nav.moodPathways'), url: "/admin/mood-pathways", icon: Brain }
```
The wellness group currently only has the employee daily check-in link. Add an admin-only sub-section.

---

## i18n Updates (both `en.json` and `ar.json`)

New keys to add under `"moodPathway"`:
```json
"moodPathway": {
  "title": "Mood Follow-up",
  "generating": "Personalizing your check-in...",
  "generatingSubtext": "Taking just a moment...",
  "shareMore": "Anything else you'd like to share?",
  "freeTextPlaceholder": "Share what's on your mind (optional)...",
  "skipQuestions": "Skip follow-up questions",
  "settingsTitle": "Mood Pathway Settings",
  "settingsDesc": "Configure AI-generated follow-up questions for each mood level. Questions rotate automatically to prevent repetition.",
  "enablePathway": "Enable AI Follow-up Questions",
  "enableFreeText": "Enable Free-Text Reflection",
  "customContext": "AI Context Hint (Optional)",
  "customContextPlaceholder": "e.g., Focus on workload, team collaboration, and energy levels...",
  "saveSettings": "Save Settings",
  "settingsSaved": "Settings saved successfully",
  "settingsFailed": "Failed to save settings",
  "extremeMoodOnly": "Available for extreme moods only (Great / Need Help)",
  "themeRotation": "Questions rotate across {{count}} themes to prevent repetition"
}
```

New nav key: `"moodPathways": "Mood Pathways"`

Arabic equivalents for all keys.

---

## File Change Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[ts]_mood_pathway_tables.sql` | Create | `mood_question_configs` + `mood_question_history` tables + RLS |
| `supabase/functions/generate-mood-questions/index.ts` | Create | Anti-duplication AI question generator edge function |
| `src/components/checkin/MoodPathwayQuestions.tsx` | Create | UI component for mood-specific follow-up questions |
| `src/hooks/useMoodQuestionConfig.ts` | Create | CRUD hook for mood pathway admin settings |
| `src/pages/admin/MoodPathwaySettings.tsx` | Create | Admin configuration page for mood pathways |
| `src/components/checkin/InlineDailyCheckin.tsx` | Modify | Integrate MoodPathwayQuestions + pass userId + enrich submit |
| `supabase/functions/generate-daily-tip/index.ts` | Modify | Accept + use pathwayAnswers for richer tip generation |
| `src/pages/EmployeeHome.tsx` | Modify | Pass `userId` from `useCurrentEmployee` to `InlineDailyCheckin` |
| `src/App.tsx` | Modify | Register `/admin/mood-pathways` route |
| `src/components/layout/AppSidebar.tsx` | Modify | Add "Mood Pathways" nav link for admins |
| `src/locales/en.json` | Modify | Add all `moodPathway.*` and `nav.moodPathways` keys |
| `src/locales/ar.json` | Modify | Add Arabic equivalents |

---

## Safety Architecture (Non-Negotiable)

The following behaviors are hardcoded and cannot be overridden by admin config or theme rotation:

1. **`need_help` (score 1):** The first question always includes support options — "I'd like to talk to HR or my manager" and "I'd prefer professional support". Only the second question (if generated) rotates themes freely.
2. **Hash comparison before insert:** Questions are only stored to history after passing the duplication check — not before.
3. **Retry cap:** Max 2 retries per generation attempt, then theme escalation. Never an infinite loop.
4. **Graceful degradation:** If the edge function fails (network, AI quota), `MoodPathwayQuestions` silently hides and does not block the check-in submission.
