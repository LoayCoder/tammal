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
  
  // Apply dynamic branding colors to CSS variables
  useBrandingColors(branding);
  
  // Apply theme-aware favicon
  useDynamicFavicon(branding);
  
  // Apply dynamic PWA icons
  useDynamicPWA(branding);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar branding={branding} />
        <div className="flex flex-1 flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
