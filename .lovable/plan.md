
# Glassmorphism UI Enhancement -- All Remaining Pages, Charts, and Sidebar Logo

## Overview
Apply the same premium glassmorphism design language (`.glass-card border-0 rounded-xl` containers, `.glass-stat` stat cards, `.glass-tabs` tab bars, icon containers with `bg-primary/10 rounded-lg`) consistently across all remaining pages. Additionally, improve chart styling and enhance the sidebar logo area.

---

## Scope of Changes

### 1. Sidebar Logo Enhancement (`src/components/layout/AppSidebar.tsx`)
- Wrap the `SidebarHeader` logo area with a subtle glass background and padding
- Add a soft glow/shadow behind the logo for premium depth
- Increase logo size slightly for better visibility (e.g., `h-10` instead of `h-8`)
- Add a subtle divider with glass styling below the logo

### 2. Admin Pages (16 pages)

**Pages with plain `<Card>` wrappers that need `.glass-card border-0 rounded-xl`:**

| Page | Key Changes |
|------|-------------|
| `AdminBranding.tsx` | Header in glass-card, all Card sections to glass-card, preview column |
| `AuditLogs.tsx` | Header with icon container, filter card + log entries card to glass-card |
| `CategoryManagement.tsx` | Header with icon container, table card to glass-card |
| `CrisisSettings.tsx` | Header with icon container in glass-card, TabsList with glass-tabs |
| `DocumentSettings.tsx` | Header with icon container, all cards to glass-card |
| `EmployeeManagement.tsx` | Header with icon container in glass-card, directory card to glass-card |
| `MoodPathwaySettings.tsx` | Info banner to glass-card, mood definitions card + per-mood cards to glass-card |
| `OrgStructure.tsx` | Header with icon container, TabsList with glass-tabs, all tab content cards to glass-card |
| `PlanManagement.tsx` | Header with icon container in glass-card, table card to glass-card |
| `ScheduleManagement.tsx` | Header with icon container in glass-card, table/content cards to glass-card |
| `SubcategoryManagement.tsx` | Header with icon container, table card to glass-card |
| `SubscriptionManagement.tsx` | Header with icon container in glass-card, table card to glass-card |
| `TenantManagement.tsx` | Header with icon container in glass-card, table card to glass-card |
| `TenantDashboard.tsx` | Header in glass-card, all stats/chart/audit cards to glass-card |
| `UnifiedUserManagement.tsx` | Header with icon container, TabsList with glass-tabs, content cards to glass-card |
| `UserManagement.tsx` | Header with icon container, TabsList with glass-tabs, content cards to glass-card |

### 3. Settings Pages (2 pages)

| Page | Key Changes |
|------|-------------|
| `UsageBilling.tsx` | Header in glass-card, plan card + usage cards to glass-stat, quota cards to glass-card |
| `UserProfile.tsx` | Header in glass-card, all profile/security cards to glass-card |

### 4. Crisis Pages (3 pages)

| Page | Key Changes |
|------|-------------|
| `CrisisRequestPage.tsx` | Step cards and intent selection cards to glass-card |
| `FirstAiderDashboard.tsx` | Header in glass-card, TabsList with glass-tabs, case cards to glass-card |
| `MySupportPage.tsx` | Header in glass-card, case list cards to glass-card |

### 5. Employee Pages (2 pages)

| Page | Key Changes |
|------|-------------|
| `DailyCheckin.tsx` | Mood/support step containers to glass-card |
| `EmployeeSurvey.tsx` | Survey container and question cards to glass-card |

### 6. Mental Toolkit Page + Sub-pages (9 pages)

| Page | Key Changes |
|------|-------------|
| `MentalToolkit.tsx` | Header area to glass-card, TabsList to glass-tabs |
| `ArticlesPage.tsx` | Cards to glass-card |
| `AssessmentPage.tsx` | Cards to glass-card |
| `BreathingPage.tsx` | Cards to glass-card |
| `HabitsPage.tsx` | Cards to glass-card |
| `JournalingPage.tsx` | Cards to glass-card |
| `MeditationPage.tsx` | Cards to glass-card |
| `MoodTrackerPage.tsx` | Cards to glass-card |
| `ThoughtReframerPage.tsx` | Cards to glass-card |

### 7. Spiritual Pages (5 pages)

| Page | Key Changes |
|------|-------------|
| `PrayerTracker.tsx` | All cards to glass-card |
| `IslamicCalendar.tsx` | Cards to glass-card |
| `QuranReader.tsx` | Cards to glass-card |
| `SpiritualInsights.tsx` | Cards to glass-card |
| `SunnahFasting.tsx` | Cards to glass-card |

### 8. Other Pages

| Page | Key Changes |
|------|-------------|
| `Support.tsx` | Header in glass-card, content card to glass-card |
| `InstallApp.tsx` | All cards to glass-card, hero section styling |
| `Auth.tsx` | Auth card to glass-card |

### 9. Chart Improvements (Global)
- Add custom glass-styled tooltip across all Recharts charts (consistent `popover` background with `rounded-xl` and subtle shadow)
- Use gradient fills (`linearGradient`) for Area charts instead of flat colors
- Add subtle grid styling with lower opacity
- Improve axis label styling with muted-foreground color
- Apply to charts in: `CheckinTrendChart`, `DashboardOverviewTab`, `OrgDashboard`, `UsageCharts`, `ParticipationTrend`, `AffectiveStateChart`, `CategoryHealthChart`, `MoodByCategoryTrend`, `RiskTrendChart`, `SupportActionsChart`, `TrendOverlayChart`, `CrisisAnalyticsTab`

### 10. Badge/Label/Tag Styling
- Apply `.glass-badge` styling to status badges across tables where appropriate
- Use semi-transparent colored backgrounds (`bg-green-500/10 text-green-600`) for status indicators instead of solid badges

---

## Design Pattern (Applied Consistently)

**Page Header:**
```text
+--[glass-card border-0 rounded-xl p-6]---+
| [icon-container bg-primary/10 rounded-lg]|
|  Title + Subtitle          [Action Btns] |
+------------------------------------------+
```

**Tab Bars:**
```text
+--[glass-tabs rounded-xl p-1]--+
| [Tab1] [Tab2] [Tab3]          |
+-------------------------------+
```

**Data Cards:**
```text
+--[glass-card border-0 rounded-xl]--+
| CardHeader                          |
| CardContent                         |
+-------------------------------------+
```

---

## Technical Notes
- All changes are CSS class swaps: `<Card>` to `<Card className="glass-card border-0 rounded-xl">`
- Headers get wrapped in `<div className="glass-card border-0 rounded-xl p-6">`
- TabsList gets `className="glass-tabs"` and TabsTriggers get `rounded-xl`
- No structural or logic changes -- purely visual consistency
- RTL-safe: using logical properties throughout (already established)
- Approximately 40+ files will be modified
