import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useSites, type Site, type SiteInput } from '@/hooks/org/useSites';
import { useBranches } from '@/hooks/org/useBranches';
import { useDepartments } from '@/hooks/org/useDepartments';
import { useDivisions } from '@/hooks/org/useDivisions';
import { useEmployees } from '@/hooks/org/useEmployees';
import { SiteTable } from '@/components/org/SiteTable';
import { SiteSheet } from '@/components/org/SiteSheet';

interface Props {
  tenantId: string;
  isLoading: boolean;
}

export function SectionsTab({ tenantId, isLoading }: Props) {
  const { t } = useTranslation();
  const { sites, createSite, updateSite, deleteSite } = useSites();
  const { branches } = useBranches();
  const { departments } = useDepartments();
  const { divisions } = useDivisions();
  const { employees } = useEmployees();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);

  const handleSubmit = (data: SiteInput) => {
    if (editing) {
      updateSite.mutate({ id: editing.id, ...data });
    } else {
      createSite.mutate(data);
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
          <CardTitle>{t('sections.title')}</CardTitle>
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="me-2 h-4 w-4" /> {t('sections.addSection')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? loadingSkeleton : (
            <SiteTable
              sites={sites}
              branches={branches}
              departments={departments}
              divisions={divisions}
              employees={employees as any}
              onEdit={(site) => { setEditing(site); setSheetOpen(true); }}
              onDelete={(id) => deleteSite.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
      <SiteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        site={editing}
        departments={departments}
        branches={branches}
        employees={employees as any}
        tenantId={tenantId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
