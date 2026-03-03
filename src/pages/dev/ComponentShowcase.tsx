import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StatusBadge,
  TENANT_STATUS_CONFIG,
  ACCOUNT_STATUS_CONFIG,
  EMPLOYEE_STATUS_CONFIG,
  CYCLE_STATUS_CONFIG,
  RISK_LEVEL_CONFIG,
  SCHEDULE_STATUS_CONFIG,
  GENERIC_TASK_STATUS_CONFIG,
  OKR_STATUS_CONFIG,
  PRAYER_STATUS_CONFIG,
} from '@/shared/status-badge';
import type { StatusBadgeConfig } from '@/shared/status-badge';

interface PresetSectionProps {
  title: string;
  config: StatusBadgeConfig;
  translationPrefix?: string;
  showIcon?: boolean;
}

function PresetSection({ title, config, translationPrefix, showIcon = false }: PresetSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {Object.keys(config).map((status) => (
          <StatusBadge
            key={status}
            status={status}
            config={config}
            translationPrefix={translationPrefix}
            showIcon={showIcon}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function ComponentShowcase() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('dev.componentShowcase', 'Component Showcase')}</h1>
        <p className="text-muted-foreground text-sm">
          Visual QA for all shared StatusBadge presets
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PresetSection title="Tenant Status" config={TENANT_STATUS_CONFIG} translationPrefix="common" />
        <PresetSection title="Account Status" config={ACCOUNT_STATUS_CONFIG} showIcon />
        <PresetSection title="Employee Status" config={EMPLOYEE_STATUS_CONFIG} translationPrefix="employees.status" />
        <PresetSection title="Recognition Cycle" config={CYCLE_STATUS_CONFIG} translationPrefix="recognition.cycle.status" />
        <PresetSection title="Risk Level" config={RISK_LEVEL_CONFIG} translationPrefix="aiGovernance.riskLevel" />
        <PresetSection title="Schedule Status" config={SCHEDULE_STATUS_CONFIG} translationPrefix="schedules.status" />
        <PresetSection title="Generic Task / Survey" config={GENERIC_TASK_STATUS_CONFIG} translationPrefix="tasks.status" />
        <PresetSection title="OKR Status" config={OKR_STATUS_CONFIG} translationPrefix="okr.status" />
        <PresetSection title="Prayer Status" config={PRAYER_STATUS_CONFIG} translationPrefix="spiritual.prayer.status" showIcon />
      </div>

      {/* Size variants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Size Variants</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">default</p>
            <StatusBadge status="active" config={TENANT_STATUS_CONFIG} translationPrefix="common" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">sm</p>
            <StatusBadge status="active" config={TENANT_STATUS_CONFIG} translationPrefix="common" size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Fallback for unknown status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Unknown Status Fallback</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <StatusBadge status="unknown_xyz" config={TENANT_STATUS_CONFIG} />
          <StatusBadge status="unknown_xyz" config={TENANT_STATUS_CONFIG} label="Custom Label" />
        </CardContent>
      </Card>
    </div>
  );
}
