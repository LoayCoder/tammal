import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const MentalToolkit = lazy(() => import("@/features/mental-toolkit/pages/MentalToolkit"));
const MoodTrackerPage = lazy(() => import("@/features/mental-toolkit/pages/MoodTrackerPage"));
const ThoughtReframerPage = lazy(() => import("@/features/mental-toolkit/pages/ThoughtReframerPage"));
const BreathingPage = lazy(() => import("@/features/mental-toolkit/pages/BreathingPage"));
const JournalingPage = lazy(() => import("@/features/mental-toolkit/pages/JournalingPage"));
const MeditationPage = lazy(() => import("@/features/mental-toolkit/pages/MeditationPage"));
const HabitsPage = lazy(() => import("@/features/mental-toolkit/pages/HabitsPage"));
const ArticlesPage = lazy(() => import("@/features/mental-toolkit/pages/ArticlesPage"));
const AssessmentPage = lazy(() => import("@/features/mental-toolkit/pages/AssessmentPage"));

export const MentalToolkitRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="toolkit"><Outlet /></PageErrorBoundary>}>
    <Route path="/mental-toolkit" element={<MentalToolkit />} />
    <Route path="/mental-toolkit/mood-tracker" element={<MoodTrackerPage />} />
    <Route path="/mental-toolkit/thought-reframer" element={<ThoughtReframerPage />} />
    <Route path="/mental-toolkit/breathing" element={<BreathingPage />} />
    <Route path="/mental-toolkit/journaling" element={<JournalingPage />} />
    <Route path="/mental-toolkit/meditation" element={<MeditationPage />} />
    <Route path="/mental-toolkit/habits" element={<HabitsPage />} />
    <Route path="/mental-toolkit/articles" element={<ArticlesPage />} />
    <Route path="/mental-toolkit/assessment" element={<AssessmentPage />} />
  </Route>
);


