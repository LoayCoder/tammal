import { useTranslation } from 'react-i18next';
import { Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardView } from '@/hooks/useDashboardView';

interface DashboardViewSwitcherProps {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export function DashboardViewSwitcher({ view, onViewChange }: DashboardViewSwitcherProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
      <Button
        variant={view === 'org' ? 'default' : 'ghost'}
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => onViewChange('org')}
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('dashboard.orgView')}</span>
      </Button>
      <Button
        variant={view === 'personal' ? 'default' : 'ghost'}
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => onViewChange('personal')}
      >
        <User className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t('dashboard.personalView')}</span>
      </Button>
    </div>
  );
}
