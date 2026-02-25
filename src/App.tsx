import "@/lib/i18n";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ManagerOrAdminRoute } from "@/components/auth/ManagerOrAdminRoute";
import { useTranslation } from "react-i18next";
import { useEffect, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// ── Eager-loaded (critical path) ──
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AcceptInvite from "@/pages/auth/AcceptInvite";

// ── Lazy-loaded pages ──
const TenantManagement = lazy(() => import("@/pages/admin/TenantManagement"));
const PlanManagement = lazy(() => import("@/pages/admin/PlanManagement"));
const SubscriptionManagement = lazy(() => import("@/pages/admin/SubscriptionManagement"));
const OrgStructure = lazy(() => import("@/pages/admin/OrgStructure"));
const AdminBranding = lazy(() => import("@/pages/admin/AdminBranding"));
const DocumentSettings = lazy(() => import("@/pages/admin/DocumentSettings"));
const UsageBilling = lazy(() => import("@/pages/settings/UsageBilling"));
const UserProfile = lazy(() => import("@/pages/settings/UserProfile"));
const Support = lazy(() => import("@/pages/Support"));
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TenantDashboard = lazy(() => import("@/pages/admin/TenantDashboard"));
const AuditLogs = lazy(() => import("@/pages/admin/AuditLogs"));
const QuestionManagement = lazy(() => import("@/pages/admin/QuestionManagement"));
const CategoryManagement = lazy(() => import("@/pages/admin/CategoryManagement"));
const AIQuestionGenerator = lazy(() => import("@/pages/admin/AIQuestionGenerator"));
const ScheduleManagement = lazy(() => import("@/pages/admin/ScheduleManagement"));
const SubcategoryManagement = lazy(() => import("@/pages/admin/SubcategoryManagement"));
const EmployeeSurvey = lazy(() => import("@/pages/employee/EmployeeSurvey"));
const DailyCheckin = lazy(() => import("@/pages/employee/DailyCheckin"));
const MentalToolkit = lazy(() => import("@/pages/MentalToolkit"));
const MoodTrackerPage = lazy(() => import("@/pages/mental-toolkit/MoodTrackerPage"));
const ThoughtReframerPage = lazy(() => import("@/pages/mental-toolkit/ThoughtReframerPage"));
const BreathingPage = lazy(() => import("@/pages/mental-toolkit/BreathingPage"));
const JournalingPage = lazy(() => import("@/pages/mental-toolkit/JournalingPage"));
const MeditationPage = lazy(() => import("@/pages/mental-toolkit/MeditationPage"));
const HabitsPage = lazy(() => import("@/pages/mental-toolkit/HabitsPage"));
const ArticlesPage = lazy(() => import("@/pages/mental-toolkit/ArticlesPage"));

const AssessmentPage = lazy(() => import("@/pages/mental-toolkit/AssessmentPage"));
const PrayerTracker = lazy(() => import("@/pages/spiritual/PrayerTracker"));
const QuranReader = lazy(() => import("@/pages/spiritual/QuranReader"));
const SunnahFasting = lazy(() => import("@/pages/spiritual/SunnahFasting"));
const SpiritualInsights = lazy(() => import("@/pages/spiritual/SpiritualInsights"));
const IslamicCalendar = lazy(() => import("@/pages/spiritual/IslamicCalendar"));
const UnifiedUserManagement = lazy(() => import("@/pages/admin/UnifiedUserManagement"));
const MoodPathwaySettings = lazy(() => import("@/pages/admin/MoodPathwaySettings"));
const CrisisSettings = lazy(() => import("@/pages/admin/CrisisSettings"));
const CrisisRequestPage = lazy(() => import("@/pages/crisis/CrisisRequestPage"));
const MySupportPage = lazy(() => import("@/pages/crisis/MySupportPage"));
const FirstAiderDashboard = lazy(() => import("@/pages/crisis/FirstAiderDashboard"));
const SurveyMonitor = lazy(() => import("@/pages/admin/SurveyMonitor"));
const CheckinMonitor = lazy(() => import("@/pages/admin/CheckinMonitor"));
const ObjectivesManagement = lazy(() => import("@/pages/admin/ObjectivesManagement"));
const ObjectiveDetail = lazy(() => import("@/pages/admin/ObjectiveDetail"));
const PersonalCommandCenter = lazy(() => import("@/pages/employee/PersonalCommandCenter"));
const WorkloadDashboard = lazy(() => import("@/pages/admin/WorkloadDashboard"));
const TeamWorkload = lazy(() => import("@/pages/admin/TeamWorkload"));
const TaskConnectors = lazy(() => import("@/pages/admin/TaskConnectors"));
const RecognitionManagement = lazy(() => import("@/pages/admin/RecognitionManagement"));
const NominatePage = lazy(() => import("@/pages/recognition/NominatePage"));
const MyNominationsPage = lazy(() => import("@/pages/recognition/MyNominationsPage"));
const VotingBoothPage = lazy(() => import("@/pages/recognition/VotingBoothPage"));
const RecognitionResults = lazy(() => import("@/pages/admin/RecognitionResults"));
const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Skeleton className="h-12 w-48" />
  </div>
);

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
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
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
              <Route path="/admin/survey-monitor" element={<AdminRoute><SurveyMonitor /></AdminRoute>} />
              <Route path="/admin/checkin-monitor" element={<AdminRoute><CheckinMonitor /></AdminRoute>} />
              <Route path="/admin/workload/objectives" element={<ManagerOrAdminRoute><ObjectivesManagement /></ManagerOrAdminRoute>} />
              <Route path="/admin/workload/objectives/:id" element={<ManagerOrAdminRoute><ObjectiveDetail /></ManagerOrAdminRoute>} />
              <Route path="/my-workload" element={<PersonalCommandCenter />} />
              <Route path="/admin/workload/dashboard" element={<AdminRoute><WorkloadDashboard /></AdminRoute>} />
              <Route path="/admin/workload/team" element={<AdminRoute><TeamWorkload /></AdminRoute>} />
              <Route path="/admin/workload/connectors" element={<AdminRoute><TaskConnectors /></AdminRoute>} />
              <Route path="/admin/recognition" element={<AdminRoute><RecognitionManagement /></AdminRoute>} />
              <Route path="/recognition/nominate" element={<NominatePage />} />
              <Route path="/recognition/my-nominations" element={<MyNominationsPage />} />
              <Route path="/recognition/vote" element={<VotingBoothPage />} />
              <Route path="/admin/recognition/results" element={<AdminRoute><RecognitionResults /></AdminRoute>} />
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
              
              <Route path="/mental-toolkit/assessment" element={<AssessmentPage />} />
              <Route path="/spiritual/prayer" element={<PrayerTracker />} />
              <Route path="/spiritual/quran" element={<QuranReader />} />
              <Route path="/spiritual/fasting" element={<SunnahFasting />} />
              <Route path="/spiritual/insights" element={<SpiritualInsights />} />
              <Route path="/spiritual/calendar" element={<IslamicCalendar />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
