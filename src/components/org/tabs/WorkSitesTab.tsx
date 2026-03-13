import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useWorkSites, type WorkSite, type WorkSiteInput } from '@/hooks/org/useWorkSites';
import { useDepartments } from '@/hooks/org/useDepartments';
import { useSites } from '@/hooks/org/useSites';
import { WorkSiteTable } from '@/components/org/WorkSiteTable';
import { WorkSiteSheet } from '@/components/org/WorkSiteSheet';

interface Props {
  tenantId: string;
  isLoading: boolean;
}

export function WorkSitesTab({ tenantId, isLoading }: Props) {
  const { t } = useTranslation();
  const { workSites, createWorkSite, updateWorkSite, deleteWorkSite } = useWorkSites();
  const { departments } = useDepartments();
  const { sites } = useSites();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WorkSite | null>(null);

  const handleSubmit = (data: WorkSiteInput) => {
    if (editing) {
      updateWorkSite.mutate({ id: editing.id, ...data });
    } else {
      createWorkSite.mutate(data);
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
          <CardTitle>{t('workSites.title')}</CardTitle>
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="me-2 h-4 w-4" /> {t('workSites.addSite')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? loadingSkeleton : (
            <WorkSiteTable
              workSites={workSites}
              departments={departments}
              sections={sites}
              onEdit={(ws) => { setEditing(ws); setSheetOpen(true); }}
              onDelete={(id) => deleteWorkSite.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
      <WorkSiteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workSite={editing}
        departments={departments}
        sections={sites}
        tenantId={tenantId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
