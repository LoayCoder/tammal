

## UI Architecture Map — Post-Cleanup Audit

### Navigation Structure

```text
MainLayout (SidebarProvider + AppSidebar + Header + MobileBottomNav)
│
├── / ........................... Dashboard (role-based: OrgDashboard / EmployeeHome)
│
├── Employee
│   ├── /employee/survey ........ EmployeeSurvey
│   ├── /employee/wellness ...... DailyCheckin
│   └── /my-workload ............ PersonalCommandCenter
│
├── Admin (33 pages)
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
├── Tasks (6 pages)
│   ├── /tasks/:id .............. TaskDetail
│   ├── /admin/workload/overdue . OverdueTasks
│   ├── /tasks/analytics ........ TaskPerformanceAnalytics
│   ├── /tasks/recurring ........ RecurringTasks
│   ├── /tasks/templates ........ TaskTemplates
│   └── /tasks/team ............. → redirect to /admin/workload/team
│
├── Recognition Employee (6 pages)
│   ├── /recognition/nominate ... NominatePage
│   ├── /recognition/my-nominations MyNominationsPage
│   ├── /recognition/vote ....... VotingBoothPage
│   ├── /recognition/points ..... PointsDashboard
│   ├── /recognition/rewards .... RedemptionCatalog
│   └── /recognition/approvals .. NominationApprovalsPage
│
├── Crisis (3 pages)
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
├── Settings (2 pages) .......... UserProfile, UsageBilling
├── Support (1 page) ............ Support
├── Install (1 page) ............ InstallApp
├── Dev QA (2 pages) ............ ComponentShowcase, DesignSystemPage
│
└── Auth (outside MainLayout)
    ├── /auth ................... Auth
    └── /auth/accept-invite ..... AcceptInvite
```

**Total: ~69 routable pages** (down from ~72 after dead code removal)

---

### Layout Components (6)

| Component | File |
|---|---|
| MainLayout | `components/layout/MainLayout.tsx` |
| AppSidebar | `components/layout/AppSidebar.tsx` |
| Header | `components/layout/Header.tsx` |
| MobileBottomNav | `components/layout/MobileBottomNav.tsx` |
| SidebarPopup | `components/layout/sidebar/SidebarPopup.tsx` |
| UserProfileSection | `components/layout/sidebar/UserProfileSection.tsx` |

---

### Design System & Shared (3 tiers)

**Tier 1 — UI Primitives** (`components/ui/`): 50 shadcn/radix components

**Tier 2 — System Layer** (`components/system/`): PageHeader, StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid

**Tier 3 — Shared Patterns** (`shared/`): DataTable, ConfirmDialog, useFormDialog, useConfirmDelete, EmptyState, ErrorBoundary, StatusBadge, Loading skeletons

**Global utilities**: LanguageSelector, ThemeToggle, UserMenu, NavLink

---

### Components by Domain

| Domain | Components | Dialogs/Modals |
|---|---|---|
| **Workload** (15) | TaskDialog, UnifiedTaskList, CapacityGauge, TeamTaskFilters, EmployeePicker, EscalationPanel, EscalationTimeline, EvidencePanel, SlaBadge | AddTeamTaskDialog, BatchDetailDialog, BulkImportDialog, DeleteTaskDialog, DistributeTaskDialog, EditTaskDialog, ExtendDueDateDialog, ObjectiveDialog, ActionDialog, InitiativeDialog, JustificationDialog |
| **Tasks feature** (11) | TaskAIPanel, TaskActivityTimeline, TaskAttachments, TaskChecklist, TaskCommentsPanel, TaskDependenciesPanel, TaskTimeTrackingPanel, TaskMembersPicker, TaskTagPicker, TaskTemplatePicker | CreateTaskModal |
| **Recognition** (29) | NominationWizard, VotingBooth, NominationCard, CycleBuilder, CycleTimeline, CriteriaEditor, CriteriaEvaluationForm, CriteriaSummaryCard, CriteriaWeightSlider, CriteriaWeightTable, CriterionScorer, RankingsTable, PointsBalanceCard, RedemptionCard, TransactionHistory, EndorsementCard, EndorsementRequestPicker, QuotaIndicator, WinnerAnnouncement, FairnessReport, VotingProgress, CycleStatusBadge, ThemeBuilder, ManagerApprovalCard, AppealForm, NominationCriteriaForm | NominationDetailDialog, NominationEditDialog, CycleEditDialog, CycleDeleteDialog |
| **Crisis** (13) | SessionWorkspace, EnhancedChatPanel, FirstAiderAvailabilityManager, FirstAiderQuickConnect, EmployeeBookingWidget, SecureAttachmentUploader, SecureAttachmentViewer, CrisisAnalyticsTab, EmergencyContactsTab, FirstAidersTab, RulesTab, SchedulesTab | RiskMappingDialog |
| **Dashboard** (32) | OrgDashboard, PersonalMoodDashboard, ExecutiveSummary, OrgFilterBar, TimeRangeSelector, AIInsightsCard, +26 chart/widget components | — |
| **Org Dashboard feature** (7) | DashboardHeader, StatCards, OverviewTab, DeepAnalysisTab, AlertsTab, ComparisonTab, OrgWorkloadIndicator | — |
| **AI Governance feature** (15) | GovernanceOverview, RiskDashboard, FinanceDashboard, RoutingInspector, SandboxMonitor, ThompsonVisualizer, +9 more | — |
| **Org Structure** (10) | BranchSheet/Table, DepartmentSheet/Table, DivisionSheet/Table, SiteSheet/Table, WorkSiteSheet/Table | — |
| **Questions** (6) | QuestionTable, QuestionTypeSelector, CategoryBadge | QuestionDialog, CategoryDialog, SubcategoryDialog |
| **Employees** (7) | EmployeeTable, EmployeeStatusBadge, AccountStatusBadge, ManagerSelect | EmployeeSheet, EmployeeInviteDialog, EmployeeImport |
| **Users** (7) | UserTable, UserMobileCard, RepresentativeTab | InviteUserDialog, UserEditDialog, UserRoleDialog, UserStatusDialog |
| **Tenants** (13) | TenantTable, TenantStatusBadge, InvitationManagement, UsageCharts, UsageStatsCards, ImageDropzone | TenantSheet, TenantDetailDialog, TenantBrandingTab, TenantContactTab, TenantModuleControl, TenantSecurityControl, TenantTrialControl |
| **Branding** (6) | BrandingPreview, DashboardBrandingPreview, HSLColorPicker, ImageUploader, ThemeIcon, ThemeLogo | — |
| **Checkin** (8) | InlineDailyCheckin, MoodStep, ScheduledQuestionsStep, SupportStep, CheckinSuccess, AchievementOverlay | MoodPathwayQuestions, MoodQuestionPickerDialog |
| **Survey/Checkin Monitor** (13) | ParticipationOverview, ParticipationTrend, DepartmentHeatmap, EmployeeStatusTable, RiskPanel, SLAIndicator, OrgFilterBar, CheckinOverview, CheckinTrendChart, CheckinDepartmentHeatmap, CheckinEmployeeTable, CheckinRiskPanel, MoodDistributionBar | — |
| **Schedules** (5) | ScheduleAudienceSelector, ScheduleForm, ScheduleTimingConfig | SchedulePreviewDialog, SchedulePreviewSection |
| **Spiritual** (6) | PrayerCard, PrayerHistory, PrayerStatusBadge, QuranHistory, SpiritualPreferencesCard | ReadingSessionDialog |
| **Mental Toolkit** (10) | ToolkitPageHeader, ToolkitCard, GradientButton, MoodTrackerTool, ThoughtReframerTool, BreathingGroundingTool, JournalingPromptsTool, HabitsPlanner, MeditationLibraryTool, PsychoeducationArticles, SelfAssessmentQuiz, CrisisSupport | — |
| **Profile** (7) | — | ChangeEmailDialog, ChangePasswordDialog, DeleteAccountDialog, EditProfileDialog, LoginActivityDialog, MFASetupDialog, SessionManagementDialog |
| **Plans** (2) | PlanTable | PlanDialog |
| **Subscriptions** (2) | SubscriptionTable | SubscriptionDialog |
| **Roles** (3) | RoleTable, PermissionMatrix | RoleDialog |
| **Audit** (1) | AuditLogTable | — |
| **Auth guards** (3) | ProtectedRoute, AdminRoute, ManagerOrAdminRoute | — |
| **Errors** (1) | PageErrorBoundary | — |
| **PWA** (1) | PWAInstallBanner | — |
| **Notifications** (1) | UnifiedNotificationBell | — |
| **Survey** (1) | AnswerInput | — |
| **Mood** (1) | — | MoodDefinitionDialog |

**Total: ~250 components across 32 domain folders**

---

### Forms Inventory

| Form | Location |
|---|---|
| Auth (login/signup) | `pages/Auth.tsx` |
| Employee Invite | `components/employees/EmployeeInviteDialog.tsx` |
| Employee CRUD | `components/employees/EmployeeSheet.tsx` |
| User Invite | `components/users/InviteUserDialog.tsx` |
| User Edit | `components/users/UserEditDialog.tsx` |
| Tenant CRUD | `components/tenants/TenantSheet.tsx` |
| Question CRUD | `components/questions/QuestionDialog.tsx` |
| Category/Subcategory | `components/questions/CategoryDialog.tsx`, `SubcategoryDialog.tsx` |
| Schedule | `components/schedules/ScheduleForm.tsx` |
| Plan/Subscription | `components/plans/PlanDialog.tsx`, `subscriptions/SubscriptionDialog.tsx` |
| Role | `components/roles/RoleDialog.tsx` |
| Task Create/Edit | `features/tasks/components/CreateTaskModal.tsx`, `workload/representative/EditTaskDialog.tsx` |
| Objective/Action/Initiative | `components/workload/ObjectiveDialog.tsx`, `ActionDialog.tsx`, `InitiativeDialog.tsx` |
| Nomination Wizard | `components/recognition/NominationWizard.tsx` |
| Cycle Builder | `components/recognition/CycleBuilder.tsx` |
| Branding | `pages/admin/AdminBranding.tsx` |
| Profile Edit | `components/profile/EditProfileDialog.tsx` |
| Change Email/Password | `components/profile/ChangeEmailDialog.tsx`, `ChangePasswordDialog.tsx` |
| MFA Setup | `components/profile/MFASetupDialog.tsx` |
| Daily Checkin | `components/checkin/InlineDailyCheckin.tsx` |
| Survey Response | `pages/employee/EmployeeSurvey.tsx` |
| Crisis Request | `pages/crisis/CrisisRequestPage.tsx` |
| Bulk Import CSV | `components/workload/representative/BulkImportDialog.tsx` |
| Appeal | `components/recognition/AppealForm.tsx` |
| AI Question Generator | `pages/admin/AIQuestionGenerator.tsx` |

---

### Dashboards Inventory

| Dashboard | Route |
|---|---|
| Org Dashboard (admin) | `/` (role: admin/manager) |
| Employee Home | `/` (role: employee) |
| Personal Command Center | `/my-workload` |
| Workload Dashboard | `/admin/workload/dashboard` |
| Team Workload | `/admin/workload/team` |
| Representative Workload | `/admin/workload/representative` |
| Portfolio Dashboard | `/admin/workload/portfolio` |
| Executive Dashboard | `/admin/workload/executive` |
| Tenant Dashboard | `/admin/tenants/:id` |
| Task Performance Analytics | `/tasks/analytics` |
| Points Dashboard | `/recognition/points` |
| First Aider Dashboard | `/first-aider` |
| Recognition Monitor | `/admin/recognition/monitor` |
| Recognition Results | `/admin/recognition/results` |
| Survey Monitor | `/admin/survey-monitor` |
| Checkin Monitor | `/admin/checkin-monitor` |
| AI Governance | `/admin/ai-governance` |
| System Health | `/admin/workload/system-health` |
| Spiritual Insights | `/spiritual/insights` |

---

### Quality Findings

#### Duplicate Components — RESOLVED
- NotificationBell: Consolidated to single `UnifiedNotificationBell` -- PASS
- User Management pages: Dead code removed -- PASS

#### Large Components (>300 lines) — 13 remain

These were identified in the previous audit and are unchanged. They are maintainable but would benefit from sub-component extraction:

| File | Est. Lines | Priority |
|---|---|---|
| QuestionManagement.tsx | ~600 | Medium |
| TeamWorkload.tsx | ~577 | Medium |
| UnifiedUserManagement.tsx | ~535 | Medium |
| RepresentativeWorkload.tsx | ~514 | Medium |
| MoodTrackerPage.tsx | ~472 | Low |
| MoodPathwaySettings.tsx | ~466 | Low |
| NominationWizard.tsx | ~463 | Low |
| ScheduleManagement.tsx | ~461 | Low |
| TaskDialog.tsx | ~405 | Low |
| IslamicCalendar.tsx | ~399 | Low |
| CreateTaskModal.tsx | ~371 | Low |
| ComponentShowcase.tsx | ~349 | N/A (dev) |
| OrgStructure.tsx | ~301 | Low |

#### Naming Inconsistencies — 3 minor patterns

| Pattern | Examples |
|---|---|
| Mixed `Page` suffix | `MoodTrackerPage` vs `MentalToolkit`, `PrayerTracker` |
| Mixed `Management` suffix | `QuestionManagement` vs `OrgStructure`, `AuditLogs` |
| Split domain folders | Task components in both `components/workload/` and `features/tasks/` |

#### Deep Nesting — PASS
No excessive nesting. Components are 2-3 levels deep maximum.

#### Dead Code — RESOLVED
All 5 previously identified dead pages have been removed.

---

### UI Architecture Status

```text
+================================================+
|           UI ARCHITECTURE STATUS               |
|                                                |
|              PASS (with advisories)            |
|                                                |
|  Pages ...................... 69   PASS         |
|  Components ................. ~250 PASS         |
|  UI Primitives .............. 50   PASS         |
|  System Components .......... 6    PASS         |
|  Shared Patterns ............ 6    PASS         |
|  Layout Components .......... 6    PASS         |
|  Forms ...................... 25+  PASS         |
|  Dashboards ................. 19   PASS         |
|  Dialogs/Modals ............. 35+  PASS         |
|  ErrorBoundary Coverage ..... Yes  PASS         |
|  i18n Coverage .............. Yes  PASS         |
|  RTL Support ................ Yes  PASS         |
|  Duplicate Components ....... 0    PASS         |
|  Dead Code Pages ............ 0    PASS         |
|  Broken Workflows ........... 0    PASS         |
|  Missing Routes ............. 0    PASS         |
|                                                |
|  Large Files (>300 lines) ... 13   ADVISORY     |
|  Naming Inconsistencies ..... 3    ADVISORY     |
|  Split Domain Folders ....... 1    ADVISORY     |
+================================================+
```

**Verdict: PASS**. All previous critical and medium issues have been resolved. The remaining advisories (large files, naming patterns) are cosmetic technical debt — they do not block any workflow or cause runtime errors. The architecture is clean, well-layered, and fully functional.

