
# Comprehensive System Audit Report

## Audit Scope
This report covers a complete end-to-end review of the Multi-Tenant SaaS Wellness Platform, examining the Employee Wellness Module, Admin Panel, Survey System, Scheduling Engine, Auth & Permissions, Localization (i18n), and PWA compliance.

---

## SECTION 1 — CRITICAL BUGS (Must Fix First)

### BUG-01: Duplicate Check-in Guard is Permanently Disabled
- **File:** `src/pages/employee/DailyCheckin.tsx` — Line 198
- **Issue:** The "already checked in today" guard is hardcoded to `false`, meaning users can submit unlimited mood entries per day on the step-by-step `/employee/wellness` route. This corrupts streak counts and point totals.
- **Code:** `if (false && todayEntry && !submitted) {` — the `false` was left from a testing session and never re-enabled.

### BUG-02: Two Competing Daily Check-in Components Are Both Active
- **Files:** `src/pages/employee/DailyCheckin.tsx` and `src/components/checkin/InlineDailyCheckin.tsx`
- **Issue:** There are now TWO complete, independent check-in implementations. `DailyCheckin.tsx` is the old multi-step page at `/employee/wellness`, while `InlineDailyCheckin.tsx` is the new inline version on the Employee Home. Both call `mood_entries` insert. The sidebar still links to `/employee/wellness` which uses the broken old component. A user could submit twice — once from Home, once from the sidebar link.
- **Impact:** Data integrity failure, double submissions, double points awarded.

### BUG-03: `useScheduledQuestions` Does NOT Filter by Schedule Type for the Survey Page
- **File:** `src/hooks/useScheduledQuestions.ts`
- **Issue:** The Employee Survey page (`/employee/survey`) uses `useScheduledQuestions` which fetches ALL scheduled questions regardless of schedule type. This means daily-checkin questions (wellness type) can appear on the survey page, causing users to answer the same question in two different flows.
- **Fix Needed:** Mirror the `schedule_type = 'survey'` filter added in `useCheckinScheduledQuestions`.

### BUG-04: `useDailyWellnessQuestions` Cache Key Has No User Dimension
- **File:** `src/hooks/useDailyWellnessQuestions.ts` — Line 20
- **Issue:** The localStorage cache key is `daily-questions:${lang}:${today}`. If two different tenants are logged in on the same browser (e.g., testing), they share the same cached question. This is a tenant data isolation issue.
- **Fix:** Include `tenantId` in the cache key: `daily-questions:${tenantId}:${lang}:${today}`.

### BUG-05: `InlineDailyCheckin` Does Not Re-enable Duplicate Guard
- **File:** `src/components/checkin/InlineDailyCheckin.tsx` — Line 172
- **Issue:** Line `if (todayEntry) return null;` correctly hides the component after submission, but it relies on `useMoodHistory` data which is fetched separately from `mood-entry-today`. After the check-in, the cache is invalidated but there is a brief window where the component reappears. The `mood-entry-today` query in `EmployeeHome.tsx` is separate from `useMoodHistory` in `InlineDailyCheckin`. There is no `todayEntry` loaded inside `InlineDailyCheckin` itself; instead it queries independently, creating a potential flash of the form.

### BUG-06: `EmployeeSurvey` Only Fetches Questions with Status `'delivered'`
- **File:** `src/pages/employee/EmployeeSurvey.tsx` — Line 21
- **Issue:** `useScheduledQuestions(employee?.id, 'delivered')` fetches ONLY `delivered` status. The schedule engine inserts questions with `status: 'pending'`. If the `deliver-questions` edge function hasn't run to transition them to `delivered`, the employee survey page will always show empty. The `pendingQuestions` filter in the hook additionally filters for `status === 'delivered' || status === 'pending'`, so passing `'delivered'` as the status parameter overrides this and excludes `pending` ones. Should pass `undefined` to use both.

### BUG-07: Slider in Wellness Question Shows Wrong Default
- **File:** `src/components/checkin/InlineDailyCheckin.tsx` and `WellnessQuestionStep.tsx`
- **Issue:** The scale/slider renders with `defaultValue={[5]}` (uncontrolled) but also tries to display `answerValue ?? 5` as a number. Since it's uncontrolled, the slider position resets to 5 on re-render while the displayed number can differ. Should be fully controlled using `value` prop.

---

## SECTION 2 — UX AND FLOW GAPS

### GAP-01: Sidebar Still Shows `/employee/wellness` Link to Old Step-by-Step Flow
- **File:** `src/components/layout/AppSidebar.tsx` — Line 90
- **Issue:** The Wellness section in the sidebar links to `/employee/wellness` which is the old multi-step `DailyCheckin.tsx` page. With the new inline check-in on the home page, this redundant route can confuse users or cause double submissions. Should either be removed from the sidebar or point to the home page `/`.

### GAP-02: `Header.tsx` Loads Branding Independently — Double Network Call
- **File:** `src/components/layout/Header.tsx` — Line 21
- **Issue:** `Header.tsx` calls `useBranding()` without a `tenantId`, resulting in fetching branding with no filtering. `MainLayout.tsx` already fetches branding and passes it to `AppSidebar`, but `Header.tsx` makes its own separate call. This is a redundant API call on every page load. The branding result in the header is unused in the current layout.

### GAP-03: `UsageBilling` Page Has Hardcoded Fake Data
- **File:** `src/pages/settings/UsageBilling.tsx`
- **Issue:** User count (`18 / 50 users`) and storage (`2.4 GB / 10 GB`) are hardcoded mock values. The `tenant_usage` table exists in the database and has real data hooks (`useTenantUsage`), but they are not wired to this page.

### GAP-04: `Support` Page and `DocumentSettings` Page Are Placeholder Stubs
- **Files:** `src/pages/Support.tsx`, `src/pages/admin/DocumentSettings.tsx`
- **Issue:** Support page is a stub with a "New Ticket" button that does nothing. DocumentSettings has been repurposed to show platform sign-up settings — not document templates. The nav label says "Document Settings" but the content is "Platform Settings." This is confusing and the page title/description don't match its actual function.

### GAP-05: Employee Survey Doesn't Filter Out Daily-Checkin Questions
- **File:** `src/hooks/useScheduledQuestions.ts`
- **Issue:** As described in BUG-03, the survey page shows questions from all schedule types including daily-checkin schedules. This means wellness questions appear in the survey and vice versa.

### GAP-06: `AchievementOverlay` Missing Arabic Translation for "Tap to Dismiss"
- **File:** `src/components/checkin/AchievementOverlay.tsx` — Line 93
- **Issue:** `t('wellness.tapToDismiss', 'Tap anywhere to dismiss')` uses a hardcoded English fallback. The key `wellness.tapToDismiss` is missing from both `en.json` and `ar.json`.

### GAP-07: `home.goodEvening` is Identical to `home.goodAfternoon` in Arabic
- **File:** `src/locales/ar.json` — Lines 1624-1625
- **Issue:** Both `goodAfternoon` and `goodEvening` translate to `"مساء الخير"`. The correct Arabic for "Good evening" is `"مساء الخير"` (which is actually correct), but `"Good afternoon"` should be `"ظهر مبارك"` or `"ظهراً سعيداً"` to differentiate. Both currently show the same string.

### GAP-08: Checkin Scheduled Questions Also Pulls Past Dates
- **File:** `src/hooks/useCheckinScheduledQuestions.ts` — Line 53
- **Issue:** The query fetches all questions where `scheduled_delivery <= todayEnd`, meaning it accumulates every past unanswered question from all previous days. If the schedule engine ran for 7 days and an employee missed 3 days, they'll see 3+ questions stacked in today's check-in. Should add `gte('scheduled_delivery', today + 'T00:00:00')` to only show today's questions.

---

## SECTION 3 — ARCHITECTURE & LOCALIZATION ISSUES

### ARCH-01: Two Different Submit Response Paths
- **Issue:** The daily check-in uses the `submit-response` edge function via `useEmployeeResponses`, but also directly updates `scheduled_questions` status using raw Supabase calls for skipped questions. This split path means there's no consistent audit trail.

### ARCH-02: `mood_entries` Table Has `as any` Type Cast Throughout
- **Files:** `DailyCheckin.tsx` line 135, `InlineDailyCheckin.tsx` line 122
- **Issue:** `supabase.from('mood_entries' as any)` suggests the `mood_entries` table is missing from the Supabase TypeScript types (`src/integrations/supabase/types.ts`). This means no compile-time type checking on mood entry inserts — high risk of silent data corruption.

### ARCH-03: RTL Logical Properties Not Universally Applied in Check-in Components
- **Files:** `MoodStep.tsx`, `InlineDailyCheckin.tsx`
- **Issue:** System constitution mandates `ms-/me-` instead of `ml-/mr-`. The check-in components use hardcoded `ArrowLeft`/`ArrowRight` icons which are visually flipped using `rtl:rotate-180`, which is correct. However, some gap classes and margin classes in these components do not use logical equivalents.

### I18N-01: Translation Key `common.noData` is Duplicated in JSON
- **Files:** `src/locales/en.json` and `src/locales/ar.json`
- **Issue:** `common.noData` appears twice in both files (lines 11 and 42). This is invalid JSON if a linter checks for duplicate keys, and the second value silently overrides the first.

### I18N-02: Missing Keys in Both Locales
The following translation keys are referenced in code but missing from locale files:
- `wellness.tapToDismiss` (used in AchievementOverlay)
- `wellness.profileNotFound` (hardcoded fallback in DailyCheckin.tsx line 190)
- `wellness.profileNotFoundDesc` (hardcoded fallback in DailyCheckin.tsx line 191)
- `common.retry` (hardcoded fallback used in DailyCheckin.tsx)
- `toast.changesSaved` (used in DocumentSettings.tsx)
- `toast.saveFailed` (used in DocumentSettings.tsx)

---

## SECTION 4 — SECURITY OBSERVATIONS

### SEC-01: External IP Lookup Services in Auth Hook
- **File:** `src/hooks/useAuth.ts` — Lines 31-35
- **Issue:** The app fetches `https://api.ipify.org` and `https://ip-api.com` on every login. These are third-party services with no SLA guarantee. If either is down, the entire login recording silently fails. More importantly, this makes a cross-origin request that could be blocked by strict CSP policies in PWA mode.

### SEC-02: `profiles_with_email` View Has No RLS Policies
- **Database:** `profiles_with_email` view
- **Issue:** The DB schema shows this view has zero RLS policies. It joins `profiles` with auth emails. Any authenticated user could potentially query this view and see all user emails across all tenants if no view-level security is enforced.

---

## Prioritized Fix Plan

```text
Priority 1 — Critical Bugs (Data Integrity)
============================================
1. BUG-01: Re-enable the duplicate check-in guard in DailyCheckin.tsx
2. BUG-02: Remove sidebar link to /employee/wellness OR deprecate DailyCheckin.tsx
3. BUG-03: Add schedule_type filter to useScheduledQuestions for survey page
4. BUG-06: Fix EmployeeSurvey to accept both pending and delivered statuses
5. ARCH-02: Fix mood_entries type cast (regenerate or manually type the table)

Priority 2 — UX Gaps
=====================
6. BUG-04: Add tenantId to wellness question cache key
7. BUG-07: Convert wellness scale slider to controlled component
8. BUG-08: Add today-only filter to useCheckinScheduledQuestions
9. GAP-03: Wire UsageBilling to real useTenantUsage hook
10. GAP-06/I18N-02: Add all missing translation keys to en.json and ar.json

Priority 3 — Code Quality & Architecture
==========================================
11. GAP-02: Remove redundant useBranding() call from Header.tsx
12. GAP-04: Rename DocumentSettings page or create a real document templates section
13. I18N-01: Remove duplicate common.noData keys from both locale files
14. SEC-01: Move IP lookup to a backend edge function to avoid CSP issues
15. SEC-02: Add explicit RLS policies to profiles_with_email view
```

The total count is **17 distinct issues** across 4 severity categories. Implementation should proceed in priority order, starting with BUG-01 through BUG-06 to restore data integrity before addressing UX and architecture concerns.
