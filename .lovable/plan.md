

## Refactor: Extract Sub-Components from 13 Large Files

Split each oversized file into focused sub-components while preserving all behavior. Files marked "Skip" are either dev tools or barely over threshold with good internal structure.

---

### 1. QuestionManagement.tsx (602 → ~120 lines)

Extract to `src/components/questions/`:
- **BatchStatusKPIs** — Status count badges (lines 178-235)
- **BatchAccordionItem** — Single batch row with inline rename, action buttons, question table (lines 280-533)
- **QuestionDetailDialog** — View question dialog (lines 540-599)
- **BatchQuestionTable** — Checkbox table with select-all, status badges (lines 469-529)

Parent becomes orchestrator: search, data hooks, accordion container.

### 2. TeamWorkload.tsx (577 → ~130 lines)

Extract to `src/components/workload/team/`:
- **TeamStatCards** — 4 KPI cards (lines 297-311)
- **WorkloadDistributionChart** — Bar chart card (lines 314-338)
- **ExecutionMetricsCard** — Velocity/completion/overdue metrics (lines 341-364)
- **RiskAlertsCard** — At-risk member list (lines 368-391)
- **TeamMemberAccordion** — Per-employee accordion with task table (lines 393-533)

### 3. UnifiedUserManagement.tsx (535 → ~180 lines)

Extract to `src/components/users/tabs/`:
- **DirectoryTab** — Search, filters, EmployeeTable, action buttons (lines 297-381)
- **AccessTab** — User search, UserTable (lines 383-421)
- **RolesTab** — Role table, create button (lines 423-452)

Parent keeps: hooks, handlers, dialog orchestration, tenant selector.

### 4. RepresentativeWorkload.tsx (514 → ~100 lines)

Extract to `src/components/workload/representative/`:
- **StrategicHierarchyTab** — Objectives → Initiatives → Actions tree (lines 179-400)
- **TaskDistributionTab** — Batch table with distribute/import actions (lines 402-480)

### 5. MoodTrackerPage.tsx (472 → ~80 lines)

Extract to `src/components/mental-toolkit/mood/`:
- **MoodStatCards** — 4 stat cards (streak, avg, entries, zone)
- **MoodTrendChart** — 14-day area chart with reference line
- **MoodHeatmap** — 7-day grid with color coding
- **MoodDistributionDonut** — Pie chart with zone breakdown
- **MoodToolsSuggestions** — Suggested tools cards section

### 6. MoodPathwaySettings.tsx (466 → ~100 lines)

Extract to `src/components/mood/settings/`:
- **MoodDefinitionManager** — Mood list with add/edit/delete/reorder/toggle
- **MoodConfigCard** — Per-mood pathway config (questions, prompts, save/reset)

### 7. NominationWizard.tsx (463 → ~80 lines)

Extract to `src/components/recognition/wizard/`:
- **NomineeSelectStep** — Employee picker with duplicate check, quota indicator
- **JustificationStep** — Textarea with justification type selector
- **CriteriaEvalStep** — Criteria evaluation form wrapper
- **ReviewStep** — Summary card with all nomination details
- **WizardStepper** — Step indicator bar

### 8. ScheduleManagement.tsx (461 → ~150 lines)

Already partially refactored (uses sub-components). Extract:
- **ScheduleListTable** — Table rows with status badges, action buttons (lines 140-300)
- **ScheduleCreateDialog** — Dialog wrapper around ScheduleForm + audience + timing (lines 300-420)

### 9. TaskDialog.tsx (405 → ~120 lines)

Extract to `src/components/workload/employee/task-dialog/`:
- **TaskDialogForm** — Form fields (title, description, status, priority, dates)
- **TaskCommentSection** — Comment list + add comment form
- **TaskEvidenceSection** — Evidence upload + viewer

### 10. IslamicCalendar.tsx (399 → ~80 lines)

Extract to `src/components/spiritual/calendar/`:
- **CalendarGrid** — Month/week grid with day cells
- **CalendarDayCell** — Individual day cell with Hijri date, events, fasting indicators
- **CalendarEventList** — Selected day events panel
- **CalendarNavigation** — Month/year navigation + view toggle

### 11. CreateTaskModal.tsx (371 → ~90 lines)

Extract to `src/features/tasks/components/create-modal/`:
- **TaskPrimaryForm** — Title, titleAr, description, template picker, checklist, attachments
- **TaskConfigPanel** — Status, priority, members, dates, tags, advanced settings

### 12. ComponentShowcase.tsx (349) — **SKIP** (dev tool)

### 13. OrgStructure.tsx (301) — **SKIP** (barely over threshold, already well-structured with tab-per-entity pattern using existing sub-components)

---

### Implementation Order

Batch 1 (highest impact): QuestionManagement, TeamWorkload, UnifiedUserManagement
Batch 2: RepresentativeWorkload, MoodTrackerPage, NominationWizard
Batch 3: MoodPathwaySettings, ScheduleManagement, TaskDialog
Batch 4: IslamicCalendar, CreateTaskModal

Each extraction follows the same pattern:
1. Create new sub-component file with props interface
2. Move JSX + local helpers into it
3. Parent passes data + callbacks as props
4. No behavior changes, no new dependencies

### Post-Refactor Target

All 11 parent files reduced to <200 lines. Total new sub-component files: ~35.

