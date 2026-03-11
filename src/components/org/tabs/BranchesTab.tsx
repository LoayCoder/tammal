import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBranches, type Branch, type BranchInput } from '@/hooks/org/useBranches';
import { BranchTable } from '@/components/org/BranchTable';
import { BranchSheet } from '@/components/org/BranchSheet';

interface Props {
  tenantId: string;
  isLoading: boolean;
}

export function BranchesTab({ tenantId, isLoading }: Props) {
  const { t } = useTranslation();
  const { branches, createBranch, updateBranch, deleteBranch } = useBranches();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const handleSubmit = (data: BranchInput) => {
    if (editing) {
      updateBranch.mutate({ id: editing.id, ...data });
    } else {
      createBranch.mutate(data);
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
          <CardTitle>{t('branches.title')}</CardTitle>
          <Button onClick={() => { setEditing(null); setSheetOpen(true); }}>
            <Plus className="me-2 h-4 w-4" /> {t('branches.addBranch')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? loadingSkeleton : (
            <BranchTable
              branches={branches}
              onEdit={(branch) => { setEditing(branch); setSheetOpen(true); }}
              onDelete={(id) => deleteBranch.mutate(id)}
            />
          )}
        </CardContent>
      </Card>
      <BranchSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        branch={editing}
        tenantId={tenantId}
        onSubmit={handleSubmit}
      />
    </>
  );
}
