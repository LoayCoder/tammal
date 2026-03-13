import { lazy } from "react";
import { Route, Navigate, Outlet } from "react-router-dom";
import { AdminRoute } from "@/features/auth/components/AdminRoute";
import { ManagerOrAdminRoute } from "@/features/auth/components/ManagerOrAdminRoute";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const TenantManagement = lazy(() => import("@/features/admin/pages/TenantManagement"));
const PlanManagement = lazy(() => import("@/features/admin/pages/PlanManagement"));
const SubscriptionManagement = lazy(() => import("@/features/admin/pages/SubscriptionManagement"));
const OrgStructure = lazy(() => import("@/features/admin/pages/OrgStructure"));
const AdminBranding = lazy(() => import("@/features/admin/pages/AdminBranding"));
const DocumentSettings = lazy(() => import("@/features/admin/pages/DocumentSettings"));
const TenantDashboard = lazy(() => import("@/features/admin/pages/TenantDashboard"));
const AuditLogs = lazy(() => import("@/features/admin/pages/AuditLogs"));
const QuestionManagement = lazy(() => import("@/features/admin/pages/QuestionManagement"));
const CategoryManagement = lazy(() => import("@/features/admin/pages/CategoryManagement"));
const AIQuestionGenerator = lazy(() => import("@/features/admin/pages/AIQuestionGenerator"));
const ScheduleManagement = lazy(() => import("@/features/admin/pages/ScheduleManagement"));
const SubcategoryManagement = lazy(() => import("@/features/admin/pages/SubcategoryManagement"));
const UnifiedUserManagement = lazy(() => import("@/features/admin/pages/UnifiedUserManagement"));
const MoodPathwaySettings = lazy(() => import("@/features/wellness/pages/MoodPathwaySettings"));
const CrisisSettings = lazy(() => import("@/features/crisis/pages/CrisisSettings"));
const SurveyMonitor = lazy(() => import("@/features/wellness/pages/SurveyMonitor"));
const CheckinMonitor = lazy(() => import("@/features/wellness/pages/CheckinMonitor"));
const ObjectivesManagement = lazy(() => import("@/features/workload/pages/ObjectivesManagement"));
const ObjectiveDetail = lazy(() => import("@/features/workload/pages/ObjectiveDetail"));
const WorkloadDashboard = lazy(() => import("@/features/workload/pages/WorkloadDashboard"));
const TeamWorkload = lazy(() => import("@/features/workload/pages/TeamWorkload"));
const TaskConnectors = lazy(() => import("@/features/workload/pages/TaskConnectors"));
const RepresentativeWorkload = lazy(() => import("@/features/workload/pages/RepresentativeWorkload"));
const PortfolioDashboard = lazy(() => import("@/features/workload/pages/PortfolioDashboard"));
const ExecutiveDashboard = lazy(() => import("@/features/workload/pages/ExecutiveDashboard"));
const SystemHealth = lazy(() => import("@/features/workload/pages/SystemHealth"));
const RecognitionManagement = lazy(() => import("@/features/recognition/pages/RecognitionManagement"));
const RecognitionResults = lazy(() => import("@/features/recognition/pages/RecognitionResults"));
const RecognitionMonitor = lazy(() => import("@/features/recognition/pages/RecognitionMonitor"));
const RedemptionManagement = lazy(() => import("@/features/recognition/pages/RedemptionManagement"));
const AIGovernance = lazy(() => import("@/features/admin/pages/AIGovernance"));
const EscalationSettings = lazy(() => import("@/features/workload/pages/EscalationSettings"));
const OverdueTasks = lazy(() => import("@/features/tasks/pages/OverdueTasks"));
const TaskPerformanceAnalytics = lazy(() => import("@/features/tasks/pages/TaskPerformanceAnalytics"));
const RecurringTasks = lazy(() => import("@/features/tasks/pages/RecurringTasks"));
const TaskTemplates = lazy(() => import("@/features/tasks/pages/TaskTemplates"));

export const AdminRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="admin"><Outlet /></PageErrorBoundary>}>
    <Route path="/admin/tenants" element={<AdminRoute><TenantManagement /></AdminRoute>} />
    <Route path="/admin/tenants/:id" element={<AdminRoute><TenantDashboard /></AdminRoute>} />
    <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
    <Route path="/admin/questions" element={<AdminRoute><QuestionManagement /></AdminRoute>} />
    <Route path="/admin/questions/generate" element={<AdminRoute><AIQuestionGenerator /></AdminRoute>} />
    <Route path="/admin/question-categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
    <Route path="/admin/question-subcategories" element={<AdminRoute><SubcategoryManagement /></AdminRoute>} />
    <Route path="/admin/employees" element={<Navigate to="/admin/user-management" replace />} />
    <Route path="/admin/schedules" element={<AdminRoute><ScheduleManagement /></AdminRoute>} />
    <Route path="/admin/plans" element={<AdminRoute><PlanManagement /></AdminRoute>} />
    <Route path="/admin/subscriptions" element={<AdminRoute><SubscriptionManagement /></AdminRoute>} />
    <Route path="/admin/users" element={<Navigate to="/admin/user-management" replace />} />
    <Route path="/admin/user-management" element={<AdminRoute><UnifiedUserManagement /></AdminRoute>} />
    <Route path="/admin/org" element={<AdminRoute><OrgStructure /></AdminRoute>} />
    <Route path="/admin/branding" element={<AdminRoute><AdminBranding /></AdminRoute>} />
    <Route path="/admin/docs" element={<AdminRoute><DocumentSettings /></AdminRoute>} />
    <Route path="/admin/mood-pathways" element={<AdminRoute><MoodPathwaySettings /></AdminRoute>} />
    <Route path="/admin/crisis-settings" element={<AdminRoute><CrisisSettings /></AdminRoute>} />
    <Route path="/admin/survey-monitor" element={<AdminRoute><SurveyMonitor /></AdminRoute>} />
    <Route path="/admin/checkin-monitor" element={<AdminRoute><CheckinMonitor /></AdminRoute>} />
    <Route path="/admin/workload/objectives" element={<ManagerOrAdminRoute><ObjectivesManagement /></ManagerOrAdminRoute>} />
    <Route path="/admin/workload/objectives/:id" element={<ManagerOrAdminRoute><ObjectiveDetail /></ManagerOrAdminRoute>} />
    <Route path="/admin/workload/dashboard" element={<AdminRoute><WorkloadDashboard /></AdminRoute>} />
    <Route path="/admin/workload/team" element={<ManagerOrAdminRoute><TeamWorkload /></ManagerOrAdminRoute>} />
    <Route path="/admin/workload/connectors" element={<AdminRoute><TaskConnectors /></AdminRoute>} />
    <Route path="/admin/workload/representative" element={<ManagerOrAdminRoute><RepresentativeWorkload /></ManagerOrAdminRoute>} />
    <Route path="/admin/workload/portfolio" element={<AdminRoute><PortfolioDashboard /></AdminRoute>} />
    <Route path="/admin/workload/executive" element={<AdminRoute><ExecutiveDashboard /></AdminRoute>} />
    <Route path="/admin/recognition" element={<AdminRoute><RecognitionManagement /></AdminRoute>} />
    <Route path="/admin/recognition/results" element={<AdminRoute><RecognitionResults /></AdminRoute>} />
    <Route path="/admin/recognition/monitor" element={<AdminRoute><RecognitionMonitor /></AdminRoute>} />
    <Route path="/admin/recognition/redemption" element={<AdminRoute><RedemptionManagement /></AdminRoute>} />
    <Route path="/admin/ai-governance" element={<AdminRoute><AIGovernance /></AdminRoute>} />
    <Route path="/admin/workload/escalation" element={<AdminRoute><EscalationSettings /></AdminRoute>} />
    <Route path="/admin/workload/system-health" element={<AdminRoute><SystemHealth /></AdminRoute>} />
    <Route path="/admin/workload/overdue" element={<ManagerOrAdminRoute><OverdueTasks /></ManagerOrAdminRoute>} />
    <Route path="/tasks/team" element={<Navigate to="/admin/workload/team" replace />} />
    <Route path="/tasks/analytics" element={<ManagerOrAdminRoute><TaskPerformanceAnalytics /></ManagerOrAdminRoute>} />
    <Route path="/tasks/recurring" element={<ManagerOrAdminRoute><RecurringTasks /></ManagerOrAdminRoute>} />
    <Route path="/tasks/templates" element={<ManagerOrAdminRoute><TaskTemplates /></ManagerOrAdminRoute>} />
  </Route>
);




