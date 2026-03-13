import { lazy } from "react";
import { Route, Outlet } from "react-router-dom";
import { PageErrorBoundary } from "@/shared/components/errors/PageErrorBoundary";

const NominatePage = lazy(() => import("@/features/recognition/pages/NominatePage"));
const MyNominationsPage = lazy(() => import("@/features/recognition/pages/MyNominationsPage"));
const VotingBoothPage = lazy(() => import("@/features/recognition/pages/VotingBoothPage"));
const PointsDashboard = lazy(() => import("@/features/recognition/pages/PointsDashboard"));
const RedemptionCatalog = lazy(() => import("@/features/recognition/pages/RedemptionCatalog"));
const NominationApprovalsPage = lazy(() => import("@/features/recognition/pages/NominationApprovalsPage"));

export const RecognitionRoutes = () => (
  <Route element={<PageErrorBoundary routeGroup="recognition"><Outlet /></PageErrorBoundary>}>
    <Route path="/recognition/nominate" element={<NominatePage />} />
    <Route path="/recognition/my-nominations" element={<MyNominationsPage />} />
    <Route path="/recognition/vote" element={<VotingBoothPage />} />
    <Route path="/recognition/points" element={<PointsDashboard />} />
    <Route path="/recognition/rewards" element={<RedemptionCatalog />} />
    <Route path="/recognition/approvals" element={<NominationApprovalsPage />} />
  </Route>
);


