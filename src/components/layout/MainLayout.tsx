import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useBranding } from "@/hooks/branding/useBranding";
import { useBrandingColors } from "@/hooks/branding/useBrandingColors";
import { useDynamicFavicon } from "@/hooks/branding/useDynamicFavicon";
import { useDynamicPWA } from "@/hooks/branding/useDynamicPWA";
import { useTenantId } from "@/hooks/org/useTenantId";

export function MainLayout() {
  const { tenantId } = useTenantId();
  const { branding } = useBranding(tenantId ?? undefined);
  
  useBrandingColors(branding);
  useDynamicFavicon(branding);
  useDynamicPWA(branding);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar branding={branding} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="relative flex-1 overflow-x-hidden p-4 md:p-6">
            {/* Decorative gradient blobs for glass depth */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute -top-24 -start-24 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
              <div className="absolute top-1/4 -end-16 h-[400px] w-[400px] rounded-full bg-chart-1/12 blur-[100px]" />
              <div className="absolute bottom-0 start-1/3 h-[350px] w-[350px] rounded-full bg-chart-2/10 blur-[100px]" />
              <div className="absolute top-2/3 end-1/4 h-[300px] w-[300px] rounded-full bg-primary/8 blur-[80px]" />
            </div>
            <div className="relative">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
