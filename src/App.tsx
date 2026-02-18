import "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import TenantManagement from "@/pages/admin/TenantManagement";
import PlanManagement from "@/pages/admin/PlanManagement";
import SubscriptionManagement from "@/pages/admin/SubscriptionManagement";
import UserManagement from "@/pages/admin/UserManagement";
import OrgStructure from "@/pages/admin/OrgStructure";
import AdminBranding from "@/pages/admin/AdminBranding";
import DocumentSettings from "@/pages/admin/DocumentSettings";
import UsageBilling from "@/pages/settings/UsageBilling";
import UserProfile from "@/pages/settings/UserProfile";
import Support from "@/pages/Support";
import InstallApp from "@/pages/InstallApp";
import NotFound from "@/pages/NotFound";
import TenantDashboard from "@/pages/admin/TenantDashboard";
import AuditLogs from "@/pages/admin/AuditLogs";
import QuestionManagement from "@/pages/admin/QuestionManagement";
import CategoryManagement from "@/pages/admin/CategoryManagement";
import EmployeeManagement from "@/pages/admin/EmployeeManagement";
import AIQuestionGenerator from "@/pages/admin/AIQuestionGenerator";
import ScheduleManagement from "@/pages/admin/ScheduleManagement";
import SubcategoryManagement from "@/pages/admin/SubcategoryManagement";
import EmployeeSurvey from "@/pages/employee/EmployeeSurvey";
import DailyCheckin from "@/pages/employee/DailyCheckin";


import UnifiedUserManagement from "@/pages/admin/UnifiedUserManagement";
import AcceptInvite from "@/pages/auth/AcceptInvite";
import MoodPathwaySettings from "@/pages/admin/MoodPathwaySettings";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

const queryClient = new QueryClient();

const I18nDirection = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nDirection />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/accept-invite" element={<AcceptInvite />} />
          <Route path="/install" element={<InstallApp />} />
          <Route element={<MainLayout />}>
            <Route path="/employee/survey" element={<EmployeeSurvey />} />
            <Route path="/employee/wellness" element={<DailyCheckin />} />
            <Route path="/" element={<Dashboard />} />
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
            
            
            <Route path="/settings/usage" element={<UsageBilling />} />
            <Route path="/settings/profile" element={<UserProfile />} />
            <Route path="/support" element={<Support />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
