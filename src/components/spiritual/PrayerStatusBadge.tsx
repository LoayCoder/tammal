import { Check, Building2, Home, Briefcase, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrayerStatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ComponentType<any> }> = {
  completed_mosque: { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', icon: Building2 },
  completed_home:   { bg: 'bg-amber-500/15',   text: 'text-amber-800 dark:text-amber-400',     icon: Home },
  completed_work:   { bg: 'bg-gray-500/15',     text: 'text-gray-700 dark:text-gray-300',       icon: Briefcase },
  missed:           { bg: 'bg-red-500/15',       text: 'text-red-700 dark:text-red-400',         icon: X },
};

export function PrayerStatusBadge({ status }: PrayerStatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_COLORS[status];
  if (!config) return null;

  const Icon = config.icon;
  const isCompleted = status.startsWith('completed');

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text} animate-in fade-in duration-300`}>
      {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
      {t(`spiritual.prayer.status.${status}`)}
    </span>
  );
}
