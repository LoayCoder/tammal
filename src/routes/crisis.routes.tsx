import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const CrisisRequestPage = lazy(() => import("@/features/crisis/pages/CrisisRequestPage"));
const MySupportPage = lazy(() => import("@/features/crisis/pages/MySupportPage"));
const FirstAiderDashboard = lazy(() => import("@/features/crisis/pages/FirstAiderDashboard"));

export const CrisisRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="crisis"><Outlet /></PageErrorBoundary>}>
    <Route path="/crisis-support" element={<CrisisRequestPage />} />
    <Route path="/my-support" element={<MySupportPage />} />
    <Route path="/first-aider" element={<FirstAiderDashboard />} />
  </Route>
);


