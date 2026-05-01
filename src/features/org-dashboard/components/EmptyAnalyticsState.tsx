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
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--brand-primary-soft)] shadow-[var(--shadow-xs)]">
        <Icon className="h-6 w-6 text-[var(--brand-primary)]" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {title ?? t('orgDashboard.emptyState.title')}
        </p>
        <p className="max-w-sm text-xs text-[var(--text-muted)]">
          {description ?? t('orgDashboard.emptyState.description')}
        </p>
      </div>
      {ctaLabel && onCta && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-xs hover:bg-[var(--bg-surface-hover)]"
          onClick={onCta}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
