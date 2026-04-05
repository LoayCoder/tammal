import { useTranslation } from 'react-i18next';
import { BarChart3, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyAnalyticsState({
  icon: Icon = BarChart3,
  title,
  description,
  ctaLabel,
  onCta,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          {title ?? t('orgDashboard.emptyState.title')}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {description ?? t('orgDashboard.emptyState.description')}
        </p>
      </div>
      {ctaLabel && onCta && (
        <Button variant="outline" size="sm" className="mt-2 text-xs rounded-xl" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
