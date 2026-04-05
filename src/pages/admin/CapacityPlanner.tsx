import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/system';
import { CapacityPlannerView } from '@/features/workload/components/CapacityPlannerView';
import { BarChart3 } from 'lucide-react';

export default function CapacityPlanner() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        title={t('capacityPlanner.pageTitle', 'Capacity Planner')}
        subtitle={t('capacityPlanner.pageDesc', 'Visual workload balancing — drag tasks between team members')}
        variant="card"
      />
      <CapacityPlannerView />
    </div>
  );
}
