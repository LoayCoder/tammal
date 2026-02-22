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
import MentalToolkit from "@/pages/MentalToolkit";
import MoodTrackerPage from "@/pages/mental-toolkit/MoodTrackerPage";
import ThoughtReframerPage from "@/pages/mental-toolkit/ThoughtReframerPage";
import BreathingPage from "@/pages/mental-toolkit/BreathingPage";
import JournalingPage from "@/pages/mental-toolkit/JournalingPage";
import MeditationPage from "@/pages/mental-toolkit/MeditationPage";
import HabitsPage from "@/pages/mental-toolkit/HabitsPage";
import ArticlesPage from "@/pages/mental-toolkit/ArticlesPage";
import CrisisPage from "@/pages/mental-toolkit/CrisisPage";
import AssessmentPage from "@/pages/mental-toolkit/AssessmentPage";
import PrayerTracker from "@/pages/spiritual/PrayerTracker";
import QuranReader from "@/pages/spiritual/QuranReader";
import SunnahFasting from "@/pages/spiritual/SunnahFasting";
import SpiritualInsights from "@/pages/spiritual/SpiritualInsights";
import IslamicCalendar from "@/pages/spiritual/IslamicCalendar";

import UnifiedUserManagement from "@/pages/admin/UnifiedUserManagement";
import AcceptInvite from "@/pages/auth/AcceptInvite";
import MoodPathwaySettings from "@/pages/admin/MoodPathwaySettings";
import CrisisSettings from "@/pages/admin/CrisisSettings";
import CrisisRequestPage from "@/pages/crisis/CrisisRequestPage";
import MySupportPage from "@/pages/crisis/MySupportPage";
import FirstAiderDashboard from "@/pages/crisis/FirstAiderDashboard";
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
            <Route path="/admin/crisis-settings" element={<AdminRoute><CrisisSettings /></AdminRoute>} />
            
            <Route path="/crisis-support" element={<CrisisRequestPage />} />
            <Route path="/my-support" element={<MySupportPage />} />
            <Route path="/first-aider" element={<FirstAiderDashboard />} />
            
            <Route path="/settings/usage" element={<UsageBilling />} />
            <Route path="/settings/profile" element={<UserProfile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/mental-toolkit" element={<MentalToolkit />} />
            <Route path="/mental-toolkit/mood-tracker" element={<MoodTrackerPage />} />
            <Route path="/mental-toolkit/thought-reframer" element={<ThoughtReframerPage />} />
            <Route path="/mental-toolkit/breathing" element={<BreathingPage />} />
            <Route path="/mental-toolkit/journaling" element={<JournalingPage />} />
            <Route path="/mental-toolkit/meditation" element={<MeditationPage />} />
            <Route path="/mental-toolkit/habits" element={<HabitsPage />} />
            <Route path="/mental-toolkit/articles" element={<ArticlesPage />} />
            <Route path="/mental-toolkit/crisis" element={<CrisisPage />} />
            <Route path="/mental-toolkit/assessment" element={<AssessmentPage />} />
            <Route path="/spiritual/prayer" element={<PrayerTracker />} />
            <Route path="/spiritual/quran" element={<QuranReader />} />
            <Route path="/spiritual/fasting" element={<SunnahFasting />} />
            <Route path="/spiritual/insights" element={<SpiritualInsights />} />
            <Route path="/spiritual/calendar" element={<IslamicCalendar />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
