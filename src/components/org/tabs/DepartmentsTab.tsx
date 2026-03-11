import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartments, type Department, type DepartmentInput } from '@/hooks/org/useDepartments';
import { useDivisions } from '@/hooks/org/useDivisions';
import { useSites } from '@/hooks/org/useSites';
import { useEmployees } from '@/hooks/org/useEmployees';
import { DepartmentTable } from '@/components/org/DepartmentTable';
import { DepartmentSheet } from '@/components/org/DepartmentSheet';

interface Props {
  tenantId: string;
  isLoading: boolean;
}

export function DepartmentsTab({ tenantId, isLoading }: Props) {
  const { t } = useTranslation();
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { divisions } = useDivisions();
  const { sites } = useSites();
  const { employees } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const handleSubmit = (data: DepartmentInput) => {
    if (editing) {
      updateDepartment.mutate({ id: editing.id, ...data });
    } else {
      createDepartment.mutate(data);
    }
  };

  const loadingSkeleton = (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  );

  return (
    <>
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('organization.departments')}</CardTitle>
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="me-2 h-4 w-4" /> {t('organization.addDepartment')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? loadingSkeleton : (
            <DepartmentTable
              departments={departments}
              divisions={divisions}
              sites={sites}
              employees={employees as any}
              onEdit={(dept) => { setEditing(dept); setSheetOpen(true); }}
              onDelete={(id) => deleteDepartment.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
      <DepartmentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        department={editing}
        divisions={divisions}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
