import React from 'react';
import { EarlyWarningPanel } from '@/components/dashboard/EarlyWarningPanel';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import type { AIPayload } from '../types';

interface Props {
  warnings: any[];
  aiPayload: AIPayload | null;
  isLoading: boolean;
}

export const AlertsTab = React.memo(function AlertsTab({ warnings, aiPayload, isLoading }: Props) {
  return (
    <div className="space-y-4">
      <EarlyWarningPanel warnings={warnings} isLoading={isLoading} />
      <AIInsightsCard analyticsData={aiPayload} isLoading={isLoading} />
    </div>
  );
});
