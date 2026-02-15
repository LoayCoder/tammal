import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useBranding } from "@/hooks/useBranding";
import { useBrandingColors } from "@/hooks/useBrandingColors";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { useDynamicPWA } from "@/hooks/useDynamicPWA";
import { supabase } from "@/integrations/supabase/client";

export function MainLayout() {
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  
  // Fetch tenant ID for the current user
  useEffect(() => {
    const fetchTenantId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        if (data?.tenant_id) {
          setTenantId(data.tenant_id);
        }
      }
    };
    fetchTenantId();
  }, []);

  const { branding } = useBranding(tenantId);
  
  // Apply dynamic branding colors to CSS variables
  useBrandingColors(branding);
  
  // Apply theme-aware favicon
  useDynamicFavicon(branding);
  
  // Apply dynamic PWA icons
  useDynamicPWA(branding);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
