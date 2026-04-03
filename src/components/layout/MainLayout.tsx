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
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import { MobileBottomNav } from "./MobileBottomNav";

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
          <PWAInstallBanner />
          <Header />
          <main className="flex-1 overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
