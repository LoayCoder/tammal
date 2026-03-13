import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useDivisions, type Division, type DivisionInput } from '@/hooks/org/useDivisions';
import { useDepartments } from '@/hooks/org/useDepartments';
import { useSites } from '@/hooks/org/useSites';
import { useEmployees } from '@/hooks/org/useEmployees';
import { DivisionTable } from '@/components/org/DivisionTable';
import { DivisionSheet } from '@/components/org/DivisionSheet';

interface Props {
  tenantId: string;
  isLoading: boolean;
}

export function DivisionsTab({ tenantId, isLoading }: Props) {
  const { t } = useTranslation();
  const { divisions, createDivision, updateDivision, deleteDivision } = useDivisions();
  const { departments } = useDepartments();
  const { sites } = useSites();
  const { employees } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Division | null>(null);

  const handleSubmit = (data: DivisionInput) => {
    if (editing) {
      updateDivision.mutate({ id: editing.id, ...data });
    } else {
      createDivision.mutate(data);
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
          <CardTitle>{t('divisions.title')}</CardTitle>
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="me-2 h-4 w-4" /> {t('divisions.addDivision')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? loadingSkeleton : (
            <DivisionTable
              divisions={divisions}
              departments={departments}
              sites={sites}
              employees={employees as any}
              onEdit={(div) => { setEditing(div); setSheetOpen(true); }}
              onDelete={(id) => deleteDivision.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
      <DivisionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        division={editing}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
