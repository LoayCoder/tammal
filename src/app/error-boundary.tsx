import { ReactNode } from "react";
import { Sentry } from "@/shared/utils/sentry";
import { ErrorBoundary as ResilienceErrorBoundary } from "@/shared/resilience/ErrorBoundary";

const SentryErrorFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="text-muted-foreground">Please refresh the page to try again.</p>
    </div>
  </div>
);

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
      <ResilienceErrorBoundary>
        {children}
      </ResilienceErrorBoundary>
    </Sentry.ErrorBoundary>
  );
}
