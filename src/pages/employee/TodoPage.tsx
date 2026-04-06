import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { VipTodoView } from '@/features/workload/components/VipTodoView';
import { Sparkles } from 'lucide-react';

export default function TodoPage() {
  const { t } = useTranslation();
  const { employee, isPending } = useCurrentEmployee();

  if (isPending) {
    return (
      <div className="space-y-6 p-4 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h1 className="text-xl font-bold tracking-tight">{t('nav.todoList', 'To-Do List')}</h1>
      </div>
      <VipTodoView
        employeeId={employee.id}
        employeeName={employee.full_name}
        tenantId={employee.tenant_id}
      />
    </div>
  );
}
