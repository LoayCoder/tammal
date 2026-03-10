import { useTranslation } from 'react-i18next';
import { Send, Package, Ban, CheckCircle } from 'lucide-react';

interface Batch {
  status: string;
}

interface BatchStatusKPIsProps {
  batches: Batch[];
}

const STATUS_CONFIG = [
  { key: 'published', icon: Send, colorClass: 'bg-green-500/10', iconClass: 'text-green-600 dark:text-green-400', labelKey: 'batches.statusPublished' },
  { key: 'draft', icon: Package, colorClass: 'bg-muted/30', iconClass: 'text-muted-foreground', labelKey: 'batches.statusDraft' },
  { key: 'inactive', icon: Ban, colorClass: 'bg-orange-500/10', iconClass: 'text-orange-600 dark:text-orange-400', labelKey: 'batches.statusInactive' },
  { key: 'validated', icon: CheckCircle, colorClass: 'bg-green-500/10', iconClass: 'text-green-600 dark:text-green-400', labelKey: 'batches.statusValidated' },
] as const;

export function BatchStatusKPIs({ batches }: BatchStatusKPIsProps) {
  const { t } = useTranslation();

  if (batches.length === 0) return null;

  const counts = batches.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STATUS_CONFIG.map(({ key, icon: Icon, colorClass, iconClass, labelKey }) => {
        const count = counts[key];
        if (!count) return null;
        return (
          <div key={key} className="glass-stat border-0 flex items-center gap-2 px-4 py-2.5 rounded-xl">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorClass}`}>
              <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            </div>
            <div>
              <p className="text-lg font-bold leading-none">{count}</p>
              <p className="text-2xs text-muted-foreground">{t(labelKey)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
