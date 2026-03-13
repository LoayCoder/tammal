import { lazy } from "react";
import { Route, Navigate, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const EmployeeSurvey = lazy(() => import("@/features/wellness/pages/EmployeeSurvey"));
const DailyCheckin = lazy(() => import("@/features/wellness/pages/DailyCheckin"));
const PersonalCommandCenter = lazy(() => import("@/features/workload/pages/PersonalCommandCenter"));
const TaskDetail = lazy(() => import("@/features/tasks/pages/TaskDetail"));

export const EmployeeRoutes = () => (
  <>
    <Route element={<PageErrorBoundary routeGroup="employee"><Outlet /></PageErrorBoundary>}>
      <Route path="/employee/survey" element={<EmployeeSurvey />} />
      <Route path="/employee/wellness" element={<DailyCheckin />} />
    </Route>

    <Route path="/my-workload" element={<PersonalCommandCenter />} />
    <Route path="/my-tasks" element={<Navigate to="/my-workload" replace />} />
    <Route path="/tasks/calendar" element={<Navigate to="/my-workload" replace />} />
    <Route path="/approval-queue" element={<Navigate to="/my-workload" replace />} />
    <Route path="/tasks/:id" element={<TaskDetail />} />
  </>
);



