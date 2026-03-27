

# TAMMAL UI QA Audit — Post Phase 4 Compliance Check

**Date**: 2026-03-27 | **Scope**: Full codebase post-migration

---

## Overall Grade: B (up from C+)

Phases 1–4 delivered major improvements. Card tokenization and typography adoption are now strong. Remaining gaps are minor and concentrated in a few files.

---

## PASSED (No Action Needed)

| Area | Status |
|---|---|
| Card tokenization (`cardVariants`) | **A** — 116 files import tokens. `glass-card border-0 rounded-xl` has **0 matches** (was 81). `glass-stat border-0` has **0 matches**. |
| Typography token adoption | **B+** — 129 files import `typography` tokens (was 7). `text-2xl font-bold` reduced from 495 matches to **10 in 2 dev-only files** (DesignSystemPage, ComponentShowcase). |
| RTL compliance | **A** — zero `ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right` violations. |
| Color system | **A** — HSL variables, dark mode, branding all correct. |
| PageHeader internal tokens | **A** — now uses `cardVariants.glass` and `typography.*` internally. |
| PageHeader adoption | **B+** — 34 files import `PageHeader`. |

---

## REMAINING ISSUES

### 1. Hardcoded `glass-card` without `cardVariants` — 6 files (Medium)

These files use raw `glass-card` string instead of `cardVariants.glass`:

| File | Pattern |
|---|---|
| `EvidencePanel.tsx` | `"border-0 glass-card"` |
| `EscalationPanel.tsx` | `"border-0 glass-card"` |
| `UserMobileCard.tsx` | `"glass-card p-4 ..."` |
| `PrayerCard.tsx` | `` `glass-card border rounded-xl ...` `` |
| `DashboardEndorsementRequests.tsx` | `"border-0 glass-card rounded-lg ..."` |
| `PrayerTracker.tsx` | `'glass-card border rounded-xl ...'` |

**Fix**: Import `cardVariants` and replace raw strings.

---

### 2. `text-xl font-bold` non-standard size — 6 files, ~47 matches (High)

`text-xl` is not a defined typography token. These should use `typography.metric` or `typography.sectionTitle`:

| File | Context |
|---|---|
| `EmployeeSurvey.tsx` | Survey title heading |
| `DivergenceHeatmap.tsx` | BAI score percentage |
| `BreathingPage.tsx` | Completion heading + stat values |
| `PrayerHistory.tsx` | Prayer percentage stat |
| `TaskDetail.tsx` | Task title heading |
| `OverdueTasks.tsx` | 4 stat card values |

**Fix**: Map `text-xl font-bold` → `typography.metric` (for numeric values) or `typography.sectionTitle` (for headings).

---

### 3. `text-lg font-semibold` not tokenized — 8 feature files (Medium)

13 files have this pattern; 5 are Shadcn primitives (acceptable). 8 are feature code that should use `typography.sectionTitle`:

| File | Context |
|---|---|
| `ParticipationOverview.tsx` | Stat value |
| `CrisisRequestPage.tsx` | Section heading |
| `MoodTrackerPage.tsx` | Empty state heading |
| `AIGovernance.tsx` | Error heading |
| `StrategicHierarchyTab.tsx` | Section heading |
| `PageErrorBoundary.tsx` | Error heading |
| `SurveyStructuralCard.tsx` | Metric value |
| `PersonalMoodDashboard.tsx` | Empty state heading |

**Fix**: Replace with `typography.sectionTitle`.

---

### 4. `App.tsx` fallback uses raw typography (Low)

Line 118: `text-2xl font-semibold` — should use `typography.pageTitle`. Minor since it's an error fallback.

---

### 5. Remaining Phase 5 items (Backlog)

- ~848 arbitrary pixel values across 111 files — classification audit not yet started.
- `font-medium` (2,400+ uses) — bulk is Shadcn primitives (acceptable). Feature code audit deferred.

---

## Summary

| Issue | Files | Severity | Action |
|---|---|---|---|
| 6 files still use raw `glass-card` | 6 | Medium | Replace with `cardVariants.glass` |
| `text-xl font-bold` non-standard | 6 | High | Map to `typography.metric` or `typography.sectionTitle` |
| `text-lg font-semibold` not tokenized | 8 | Medium | Replace with `typography.sectionTitle` |
| `App.tsx` raw typography | 1 | Low | Replace with `typography.pageTitle` |
| Arbitrary values audit (Phase 5) | 111 | Backlog | Deferred |

**Total remaining gaps**: 21 files need minor fixes. Estimated effort: ~1 session to reach A grade.

