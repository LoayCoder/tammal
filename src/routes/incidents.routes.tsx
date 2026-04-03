import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const IncidentsPage = lazy(() => import("@/pages/IncidentsPage"));

export const IncidentRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="incidents"><Outlet /></PageErrorBoundary>}>
    <Route path="/incidents" element={<IncidentsPage />} />
  </Route>
);
