

## UI Architecture Map

### Navigation Structure

```text
MainLayout (SidebarProvider + AppSidebar + Header + MobileBottomNav)
├── / ........................... Dashboard (role-based: OrgDashboard / EmployeeHome)
│
├── Employee
│   ├── /employee/survey ........ EmployeeSurvey
│   ├── /employee/wellness ...... DailyCheckin
│   └── /my-workload ............ PersonalCommandCenter
│
├── Admin (35 pages)
│   ├── Tenant .................. TenantManagement, TenantDashboard
│   ├── Users ................... UnifiedUserManagement
│   ├── Org ..................... OrgStructure
│   ├── Surveys ................. QuestionManagement, CategoryManagement,
│   │                            SubcategoryManagement, AIQuestionGenerator,
│   │                            ScheduleManagement, SurveyMonitor, CheckinMonitor
│   ├── Plans & Billing ......... PlanManagement, SubscriptionManagement
│   ├── Branding & Docs ......... AdminBranding, DocumentSettings
│   ├── Wellness ................ MoodPathwaySettings, CrisisSettings
│   ├── Workload ................ WorkloadDashboard, TeamWorkload,
│   │                            RepresentativeWorkload, ObjectivesManagement,
│   │                            ObjectiveDetail, TaskConnectors,
│   │                            PortfolioDashboard, ExecutiveDashboard,
│   │                            EscalationSettings, SystemHealth
│   ├── Recognition ............. RecognitionManagement, RecognitionResults,
│   │                            RecognitionMonitor, RedemptionManagement
│   ├── Governance .............. AIGovernance, AuditLogs
│   └── Redirects ............... /admin/employees → /admin/user-management
│                                 /admin/users → /admin/user-management
│
├── Tasks
│   ├── /tasks/:id .............. TaskDetail
│   ├── /admin/workload/overdue . OverdueTasks
│   ├── /tasks/analytics ........ TaskPerformanceAnalytics
│   ├── /tasks/recurring ........ RecurringTasks
│   └── /tasks/templates ........ TaskTemplates
│
├── Recognition (Employee)
│   ├── /recognition/nominate ... NominatePage
│   ├── /recognition/my-nominations MyNominationsPage
│   ├── /recognition/vote ....... VotingBoothPage
│   ├── /recognition/points ..... PointsDashboard
│   ├── /recognition/rewards .... RedemptionCatalog
│   └── /recognition/approvals .. NominationApprovalsPage
│
├── Crisis
│   ├── /crisis-support ......... CrisisRequestPage
│   ├── /my-support ............. MySupportPage
│   └── /first-aider ............ FirstAiderDashboard
│
├── Mental Toolkit (9 pages)
│   ├── /mental-toolkit ......... MentalToolkit (hub)
│   ├── mood-tracker, thought-reframer, breathing, journaling,
│   │   meditation, habits, articles, assessment
│
├── Spiritual (6 pages)
│   ├── prayer, quran, quran/read, sunnah, insights, calendar
│
├── Settings
│   ├── /settings/profile ....... UserProfile
│   └── /settings/usage ......... UsageBilling
│
├── Other
│   ├── /support ................ Support
│   ├── /install ................ InstallApp
│   └── /dev/components, /dev/design-system (QA)
│
└── Auth (outside MainLayout)
    ├── /auth ................... Auth
    └── /auth/accept-invite ..... AcceptInvite
```

**Total: ~72 routable pages**

---

### Layout Components

| Component | Location | Lines |
|---|---|---|
| MainLayout | components/layout/MainLayout.tsx | 51 |
| AppSidebar | components/layout/AppSidebar.tsx | — |
| Header | components/layout/Header.tsx | — |
| MobileBottomNav | components/layout/MobileBottomNav.tsx | — |
| SidebarPopup | components/layout/sidebar/SidebarPopup.tsx | — |
| UserProfileSection | components/layout/sidebar/UserProfileSection.tsx | — |

---

### Design System / Shared Components

**System layer** (`src/components/system/`): PageHeader, StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid

**Shared patterns** (`src/shared/`):
- `data-table/` — Generic DataTable with ColumnDef
- `dialogs/` — ConfirmDialog, useFormDialog, useConfirmDelete
- `empty/` — EmptyState
- `loading/` — Loading skeletons
- `resilience/` — ErrorBoundary
- `status-badge/` — Reusable status badges

**UI primitives** (`src/components/ui/`): 48 shadcn/radix components

**Global utilities**: LanguageSelector, ThemeToggle, UserMenu, NavLink

**Mental Toolkit shared**: ToolkitPageHeader, ToolkitCard, GradientButton

---

### Major Component Groups

| Domain | Components | Key Modals/Dialogs |
|---|---|---|
| Workload | TaskDialog, UnifiedTaskList, CapacityGauge, TeamTaskFilters, AddTeamTaskDialog, EmployeePicker | CreateTaskModal, BatchDetailDialog, BulkImportDialog, DeleteTaskDialog, DistributeTaskDialog, EditTaskDialog, ExtendDueDateDialog, ObjectiveDialog, ActionDialog, InitiativeDialog |
| Recognition | NominationWizard, VotingBooth, NominationCard, CycleBuilder, CycleTimeline, CriteriaEditor, RankingsTable, PointsBalanceCard, RedemptionCard, TransactionHistory, EndorsementCard, QuotaIndicator, WinnerAnnouncement, FairnessReport | NominationDetailDialog, NominationEditDialog, CycleEditDialog, CycleDeleteDialog, AppealForm |
| Crisis | SessionWorkspace, EnhancedChatPanel, FirstAiderAvailabilityManager, FirstAiderQuickConnect, EmployeeBookingWidget, SecureAttachmentUploader/Viewer, CrisisAnalyticsTab | RiskMappingDialog |
| Dashboard | OrgDashboard, PersonalMoodDashboard, ExecutiveSummary, 30+ chart/widget components | — |
| Spiritual | PrayerCard, PrayerHistory, PrayerStatusBadge, QuranHistory, SpiritualPreferencesCard | ReadingSessionDialog |
| Tasks (features/) | TaskAIPanel, TaskActivityTimeline, TaskAttachments, TaskChecklist, TaskCommentsPanel, TaskDependenciesPanel, TaskTimeTrackingPanel, TaskMembersPicker, TaskTagPicker, TaskTemplatePicker | CreateTaskModal |

---

### Quality Findings

#### Duplicate Components

| Issue | Files | Severity |
|---|---|---|
| **3x NotificationBell** | `components/notifications/UnifiedNotificationBell.tsx`, `features/tasks/components/NotificationBell.tsx`, `components/crisis/NotificationBell.tsx` | WARNING |
| **3x User Management pages** | `EmployeeManagement.tsx` (215 lines), `UserManagement.tsx` (unreferenced), `UnifiedUserManagement.tsx` (535 lines) — only Unified is routed; other two are dead code | WARNING |

#### Large Components (>300 lines)

| File | Lines | Recommendation |
|---|---|---|
| `QuestionManagement.tsx` | 602 | Extract question table, form, filter sections |
| `TeamWorkload.tsx` | 577 | Extract table, filters, stats into sub-components |
| `UnifiedUserManagement.tsx` | 535 | Already tabbed; extract each tab to own component |
| `RepresentativeWorkload.tsx` | 514 | Extract batch table, stats panel |
| `MoodTrackerPage.tsx` | 472 | Extract chart sections, streak display |
| `MoodPathwaySettings.tsx` | 466 | Extract pathway list, editor form |
| `NominationWizard.tsx` | 463 | Multi-step wizard; extract step components |
| `ScheduleManagement.tsx` | 461 | Extract schedule form, audience resolver UI |
| `TaskDialog.tsx` | 405 | Extract metadata panels, form sections |
| `IslamicCalendar.tsx` | 399 | Extract calendar grid, event list |
| `CreateTaskModal.tsx` | 371 | Extract form sections |
| `ComponentShowcase.tsx` | 349 | Dev tool — acceptable |
| `OrgStructure.tsx` | 301 | Extract tree view, form panels |

#### Dead Code

| File | Issue |
|---|---|
| `src/pages/admin/EmployeeManagement.tsx` | Not routed — superseded by UnifiedUserManagement |
| `src/pages/admin/UserManagement.tsx` | Not routed — superseded by UnifiedUserManagement |
| `src/features/tasks/pages/ApprovalQueue.tsx` | Not routed — redirect sends to /my-workload |
| `src/features/tasks/pages/TaskCalendar.tsx` | Not routed — redirect sends to /my-workload |
| `src/features/tasks/pages/MyTasks.tsx` | Not routed — redirect sends to /my-workload |

#### Naming Inconsistencies

| Pattern | Examples |
|---|---|
| Mixed `Page` suffix | `MoodTrackerPage`, `BreathingPage` vs `MentalToolkit`, `PrayerTracker` |
| Mixed `Management` suffix | `QuestionManagement`, `RecognitionManagement` vs `OrgStructure`, `AuditLogs` |
| Feature vs Component overlap | Task components split between `components/workload/` and `features/tasks/` |

#### Deep Nesting — OK
No excessive nesting detected. Most components are 2-3 levels. Feature modules are well-scoped.

---

### UI Architecture Status

```text
╔══════════════════════════════════════════════╗
║           UI ARCHITECTURE STATUS             ║
║                                              ║
║              ⚠ WARNING                       ║
║                                              ║
║  Pages ...................... 72   PASS       ║
║  UI Primitives .............. 48   PASS       ║
║  System Components .......... 6    PASS       ║
║  Shared Patterns ............ 6    PASS       ║
║  Layout Components .......... 6    PASS       ║
║  ErrorBoundary Coverage ..... Yes  PASS       ║
║  i18n Coverage .............. Yes  PASS       ║
║  RTL Support ................ Yes  PASS       ║
║                                              ║
║  Duplicate Components ....... 2    WARNING    ║
║  Dead Code Pages ............ 5    WARNING    ║
║  Large Files (>300 lines) ... 13   WARNING    ║
║  Naming Inconsistencies ..... 3    WARNING    ║
║                                              ║
║  Broken Workflows ........... 0    PASS       ║
║  Missing Routes ............. 0    PASS       ║
╚══════════════════════════════════════════════╝
```

**Summary**: Architecturally sound with good separation (system layer, shared patterns, feature modules, ErrorBoundary wrapping, full i18n/RTL). The warnings are housekeeping — 5 dead-code pages to delete, 3 duplicate NotificationBells to consolidate, and 13 large files that would benefit from extraction into sub-components. No structural failures.

