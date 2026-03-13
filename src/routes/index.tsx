import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { MainLayout } from "@/shared/components/layout/MainLayout";

import { AdminRoutes } from "./admin.routes";
import { EmployeeRoutes } from "./employee.routes";
import { CrisisRoutes } from "./crisis.routes";
import { RecognitionRoutes } from "./recognition.routes";
import { SpiritualRoutes } from "./spiritual.routes";
import { MentalToolkitRoutes } from "./mental-toolkit.routes";

// ── Eager-loaded (critical path) ──
import Auth from "@/features/auth/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AcceptInvite from "@/features/auth/pages/AcceptInvite";

// ── Lazy-loaded base/misc pages ──
const InstallApp = lazy(() => import("@/pages/InstallApp"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const UsageBilling = lazy(() => import("@/pages/settings/UsageBilling"));
const UserProfile = lazy(() => import("@/pages/settings/UserProfile"));
const Support = lazy(() => import("@/pages/Support"));
const ComponentShowcase = lazy(() => import("@/pages/dev/ComponentShowcase"));
const DesignSystemPage = lazy(() => import("@/pages/dev/DesignSystemPage"));

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Skeleton className="h-12 w-48" />
  </div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/accept-invite" element={<AcceptInvite />} />
        <Route path="/install" element={<InstallApp />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {AdminRoutes()}
            {EmployeeRoutes()}
            {RecognitionRoutes()}
            {CrisisRoutes()}
            {MentalToolkitRoutes()}
            {SpiritualRoutes()}

            {/* General Authed Routes */}
            <Route path="/settings/usage" element={<UsageBilling />} />
            <Route path="/settings/profile" element={<UserProfile />} />
            <Route path="/support" element={<Support />} />

            {/* Dev Routes */}
            <Route path="/dev/components" element={<ComponentShowcase />} />
            <Route path="/dev/design-system" element={<DesignSystemPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}


