import "@/lib/i18n";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Support from "@/pages/Support";
import InstallApp from "@/pages/InstallApp";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/install" element={<InstallApp />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin/tenants" element={<TenantManagement />} />
            <Route path="/admin/plans" element={<PlanManagement />} />
            <Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/org" element={<OrgStructure />} />
            <Route path="/admin/branding" element={<AdminBranding />} />
            <Route path="/admin/docs" element={<DocumentSettings />} />
            <Route path="/settings/usage" element={<UsageBilling />} />
            <Route path="/support" element={<Support />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
