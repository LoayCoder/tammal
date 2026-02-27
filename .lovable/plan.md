

## Phase 1: Architecture Refactor -- Updated Plan

### Overview
Zero-UI-change refactor: remove 70 re-export shims, extract direct database calls into a service layer, unify streak/points logic, and add data integrity safeguards. All user feedback has been incorporated.

---

### 0. Database Migration (New -- Integrity Guards)

**Add unique constraints** to prevent double-submit and duplicate data:

```sql
-- Prevent duplicate daily check-ins
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_entries_employee_date
  ON public.mood_entries (employee_id, entry_date)
  WHERE deleted_at IS NULL;

-- Prevent duplicate daily_checkin points for same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_tx_checkin_unique
  ON public.points_transactions (user_id, source_type, created_at::date)
  WHERE source_type = 'daily_checkin' AND deleted_at IS NULL;
```

These act as a database-level idempotency guard. The service layer will catch unique-violation errors and treat them as "already submitted" rather than failures.

---

### 1. Service Layer Creation

#### `src/services/gamificationService.ts` -- Single Source of Truth

Canonical decisions documented in the file:
- **Source table**: `mood_entries.entry_date` (DATE column, not `created_at`)
- **UTC normalization**: Parse `entry_date` as `YYYY-MM-DD` in UTC; compare using `Date.UTC()`
- **Streak semantics**: Streak counts consecutive days ending at today. If today has no entry, the chain starts from yesterday
- **Points formula**: `calculatePoints(streakBeforeToday)` -- points are based on the streak BEFORE today's entry is recorded. This matches the current behavior where `calculatePoints(streak)` is called before the insert. The decision is: "your reward for today = base 10 + bonus for how many days you already had in a row"

```text
Exports:
  calculatePoints(streakBeforeToday: number): number
  computeStreak(entries: { entry_date: string }[]): number
  computeTotalPoints(entries: { points_earned: number | null }[]): number
  fetchGamificationData(employeeId: string): Promise<{ streak: number; totalPoints: number }>
```

Pure async functions, no React imports, no supabase import at the top level -- supabase client is passed as a parameter or imported from `@/integrations/supabase/client` (since services are not React but can import the configured client).

#### `src/services/checkinService.ts`

```text
Exports:
  fetchTodayEntry(employeeId: string, date: string): Promise<MoodEntry | null>
  submitMoodEntry(params: CheckinParams): Promise<CheckinResult>
  generateDailyTip(moodLevel: string, pathwayAnswers: PathwayAnswer[], language: string): Promise<string>
```

`submitMoodEntry` flow:
1. Call `generateDailyTip()` (catch errors -- tip is optional)
2. Call `gamificationService.calculatePoints(currentStreak)` -- streak BEFORE today
3. Insert into `mood_entries` with `streak_count = currentStreak + 1`
4. Insert into `points_transactions` (amount = calculated points)
5. If insert fails with unique violation (23505), return `{ alreadySubmitted: true }` instead of throwing
6. Return `{ tip, pointsEarned, newStreak, alreadySubmitted: false }`

No React Query cache invalidation inside the service -- that stays in the hook.

#### `src/services/inviteService.ts`

```text
Exports:
  verifyInviteCode(code: string): Promise<Invitation | null>
  acceptInvite(params: AcceptInviteParams): Promise<void>
```

#### `src/services/aiService.ts`

```text
Exports:
  rewritePrompt(params): Promise<RewriteResult>
  rewriteQuestion(params): Promise<RewriteResult>
```

Wraps `supabase.functions.invoke('rewrite-prompt')` and `supabase.functions.invoke('rewrite-question')`.

#### `src/services/tenantService.ts`

```text
Exports:
  getTenantIdForUser(userId: string): Promise<string | null>  // wraps supabase.rpc('get_user_tenant_id')
```

---

### 2. Hook Layer (Thin Wrappers)

#### `src/hooks/checkin/useCheckinSubmit.ts` (New)

```text
Exposes: { submitCheckin, isSubmitting, error }

submitCheckin(params) =>
  1. Calls checkinService.submitMoodEntry()
  2. If alreadySubmitted, shows info toast, returns
  3. On success: invalidates React Query caches (gamification, mood-entry-today, mood-history, points-transactions)
  4. Returns { tip, pointsEarned, newStreak }
```

Both `DailyCheckin.tsx` and `InlineDailyCheckin.tsx` use this hook. They only:
- Collect UI inputs (mood, pathway answers, comment)
- Call `submitCheckin(data)`
- Show success animation / error messages

#### `src/hooks/checkin/useTodayEntry.ts` (New)

Wraps `checkinService.fetchTodayEntry()` with React Query. Currently duplicated in both `DailyCheckin.tsx` and `InlineDailyCheckin.tsx`.

#### `src/hooks/wellness/useGamification.ts` (Refactor)

Becomes a thin wrapper:
- `queryFn` calls `gamificationService.fetchGamificationData(employeeId)`
- `calculatePoints` delegates to `gamificationService.calculatePoints()`
- No streak computation logic inside the hook

#### `src/hooks/admin/usePromptRewrite.ts` (New)
Wraps `aiService.rewritePrompt()`.

#### `src/hooks/admin/useQuestionRewrite.ts` (New)
Wraps `aiService.rewriteQuestion()`.

#### `src/hooks/admin/useMoodTagging.ts` (New)
Handles tag/untag operations for `MoodPathwaySettings.tsx`.

#### `src/hooks/auth/useAcceptInvite.ts` (New)
Calls `inviteService.verifyInviteCode()` and `inviteService.acceptInvite()`.

#### `src/hooks/auth/useDeleteAccount.ts` (New)
Wraps the profile deletion currently inline in `DeleteAccountDialog.tsx`.

#### `src/hooks/admin/useScheduleData.ts` (New)
Department/employee queries for `ScheduleManagement.tsx`.

#### `src/hooks/admin/useScheduleActions.ts` (New)
Edge function calls (run-now, preview) for `ScheduleManagement.tsx`.

---

### 3. Refactor P1 Offender Files

| File | Change |
|------|--------|
| `DailyCheckin.tsx` | Remove all `supabase.*` calls. Use `useCheckinSubmit` + `useTodayEntry` |
| `InlineDailyCheckin.tsx` | Same as above |
| `MoodStep.tsx` | Remove inline `supabase.auth.getUser()` + profile query. Accept `tenantId` as prop (parent always has it) |
| `AIQuestionGenerator.tsx` | Use `usePromptRewrite` hook (calls `aiService`) + use existing `useTenantId` from `@/hooks/org/useTenantId` |
| `MoodPathwaySettings.tsx` | Use `useMoodTagging` hook + existing `useTenantId` |
| `AcceptInvite.tsx` | Use `useAcceptInvite` hook (calls `inviteService`) |
| `ScheduleManagement.tsx` | Use `useScheduleData` + `useScheduleActions` hooks |
| `DeleteAccountDialog.tsx` | Use `useDeleteAccount` hook |
| `QuestionCard.tsx` | Use `useQuestionRewrite` hook (calls `aiService`) |

---

### 4. Unify Streak Logic -- 3 Implementations Consolidated

| Location | Current | After |
|----------|---------|-------|
| `useGamification.ts` | UTC streak loop inline | Calls `gamificationService.computeStreak()` |
| `DailyCheckin.tsx` / `InlineDailyCheckin.tsx` | Uses `streak` from hook, calculates points inline | Calls `useCheckinSubmit` which calls `gamificationService` |
| `analyticsQueries.ts` (admin leaderboard) | Local-time streak calculation with `setHours(0,0,0,0)` | Calls `gamificationService.computeStreak()` -- fixes a timezone bug where admin and employee streaks could disagree |

The `analyticsQueries.ts` leaderboard function also has a divergent points formula: `(entries.length * 10) + (streak * 5)` which differs from the per-entry formula `10 + min(streak*5, 50)`. This will be updated to use `gamificationService.calculatePoints()` accumulated over entries for consistency.

---

### 5. Hook Re-export Shim Removal

**Execution order (safe approach)**:
1. First, update ALL imports across the codebase to point to canonical paths
2. Then, in the same pass, delete the 70 shim files
3. This is done atomically -- no intermediate broken state

All 70 files at `src/hooks/*.ts` that are single-line `export * from './subfolder/...'` will be deleted. Examples:
- `useAuth.ts` -> consumers import from `@/hooks/auth/useAuth`
- `useGamification.ts` -> consumers import from `@/hooks/wellness/useGamification`
- `useTenantId.ts` -> consumers import from `@/hooks/org/useTenantId`
- `useMoodDefinitions.ts` -> consumers import from `@/hooks/wellness/useMoodDefinitions`
- (and ~66 more)

---

### 6. MoodStep.tsx tenantId Prop Threading

Currently `MoodStep.tsx` fetches `tenantId` by calling `supabase.auth.getUser()` + profile query internally. After refactor:
- `MoodStep` accepts `tenantId` as a required prop
- Both parents (`DailyCheckin.tsx` and `InlineDailyCheckin.tsx`) already have `tenantId` available
- No internal fetch needed, eliminates redundant network call and re-renders

---

### Execution Order

1. **Database migration**: Add unique constraints (idempotency guards)
2. **Create services**: `gamificationService`, `checkinService`, `inviteService`, `aiService`, `tenantService`
3. **Create new hooks**: `useCheckinSubmit`, `useTodayEntry`, `useAcceptInvite`, `useDeleteAccount`, `usePromptRewrite`, `useQuestionRewrite`, `useMoodTagging`, `useScheduleData`, `useScheduleActions`
4. **Refactor `useGamification`**: delegate to `gamificationService`
5. **Refactor `analyticsQueries.ts`**: delegate streak/points to `gamificationService`
6. **Update 9 P1 offender files**: remove direct supabase calls, use new hooks
7. **Update all imports + delete 70 shims**: single atomic pass

---

### Dependency Map (Post-Refactor)

```text
Pages/Components              Hooks                          Services
-----------------              -----                          --------
DailyCheckin.tsx          -->  useCheckinSubmit           -->  checkinService
                          -->  useTodayEntry              -->  checkinService
InlineDailyCheckin.tsx    -->  useCheckinSubmit           -->  checkinService
                          -->  useTodayEntry              -->  checkinService
EmployeeHome.tsx          -->  useGamification            -->  gamificationService
MoodTrackerPage.tsx       -->  useGamification            -->  gamificationService
AcceptInvite.tsx          -->  useAcceptInvite            -->  inviteService
AIQuestionGenerator.tsx   -->  usePromptRewrite           -->  aiService
                          -->  useTenantId                -->  tenantService
MoodPathwaySettings.tsx   -->  useMoodTagging             -->  (supabase update via service)
                          -->  useTenantId                -->  tenantService
ScheduleManagement.tsx    -->  useScheduleData            -->  (supabase queries via service)
                          -->  useScheduleActions         -->  (edge function via service)
MoodStep.tsx              -->  (tenantId via props)        --  no service needed
DeleteAccountDialog.tsx   -->  useDeleteAccount           -->  (supabase delete via service)
QuestionCard.tsx          -->  useQuestionRewrite         -->  aiService
analyticsQueries.ts       -->  (direct import)            -->  gamificationService
```

Zero supabase imports remain in any page or component after this refactor.

---

### File Changelog

| Action | Count | Details |
|--------|-------|---------|
| **DB Migration** | 1 | Unique constraints on `mood_entries` and `points_transactions` |
| **Create** | ~14 | 5 services + ~9 new hooks |
| **Delete** | 70 | All `src/hooks/*.ts` re-export shims |
| **Modify** | ~80+ | Import path updates + 9 P1 offender refactors + `useGamification` + `analyticsQueries.ts` |

