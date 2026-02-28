import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import i18n from 'i18next';
import { logger } from '@/lib/logger';

interface PageErrorBoundaryProps {
  children: ReactNode;
  /** Identifies the route group for telemetry (e.g. 'admin', 'employee', 'toolkit') */
  routeGroup: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

/**
 * Page-level ErrorBoundary for deep route containment.
 *
 * Sits between the global App boundary and individual component boundaries
 * to prevent a single page crash from tearing down the entire layout.
 *
 * - Logs to logger.error (→ Sentry in production)
 * - Shows a safe fallback with Retry + Back to Home
 * - Never exposes stack traces to the UI
 */
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log with scope metadata — no PII, no stack in UI
    logger.error('PageErrorBoundary', `Uncaught error in [${this.props.routeGroup}] route group`, error);
    // errorInfo.componentStack is only used internally for Sentry context
    if (import.meta.env.MODE === 'production') {
      try {
        // Dynamic import to avoid hard dep when Sentry is tree-shaken
        import('@sentry/react').then((Sentry) => {
          Sentry.withScope((scope) => {
            scope.setTag('route_group', this.props.routeGroup);
            scope.setTag('error_scope', 'page');
            scope.setExtra('componentStack', errorInfo.componentStack);
            Sentry.captureException(error);
          });
        });
      } catch {
        // Sentry unavailable — already logged above
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  handleGoHome = (): void => {
    // Navigate to safe route — works without react-router context
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="glass-card border-0 rounded-xl max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                {i18n.t('common.somethingWentWrong', 'Something went wrong')}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {i18n.t(
                  'common.pageErrorDescription',
                  'This section encountered an unexpected error. You can retry or return to the home page.'
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4 me-2" />
                {i18n.t('common.tryAgain', 'Try Again')}
              </Button>
              <Button variant="default" size="sm" onClick={this.handleGoHome}>
                <Home className="h-4 w-4 me-2" />
                {i18n.t('common.backToHome', 'Back to Home')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
