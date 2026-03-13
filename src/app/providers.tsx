import { ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { useTranslation } from "react-i18next";
import { AppErrorBoundary } from "./error-boundary";
import "@/shared/utils/i18n";

const queryClient = new QueryClient();

const I18nDirection = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nDirection />
        <TooltipProvider>
          <Sonner />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
