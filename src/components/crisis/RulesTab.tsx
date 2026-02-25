import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRiskMappings, useCreateRiskMapping, useUpdateRiskMapping, useDeleteRiskMapping, type RiskMapping } from '@/hooks/crisis/useRiskMappings';
import RiskMappingDialog from './RiskMappingDialog';

const riskBadgeVariant = (level: string) => {
  if (level === 'high') return 'destructive' as const;
  if (level === 'low') return 'default' as const;
  return 'secondary' as const;
};

export default function RulesTab() {
  const { t } = useTranslation();
  const { data: mappings, isLoading } = useRiskMappings();
  const createMutation = useCreateRiskMapping();
  const updateMutation = useUpdateRiskMapping();
  const deleteMutation = useDeleteRiskMapping();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RiskMapping | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RiskMapping | null>(null);

  const handleAdd = () => { setEditing(null); setDialogOpen(true); };
  const handleEdit = (m: RiskMapping) => { setEditing(m); setDialogOpen(true); };

  const handleSubmit = (values: { intent: string; risk_level: string; action_description?: string }) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...values }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{t('crisisSupport.admin.riskMapping', 'Risk Level Mapping')}</CardTitle>
            <CardDescription>{t('crisisSupport.admin.riskMappingDesc', 'Configure how intents map to risk levels')}</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t('crisisSupport.admin.addRule', 'Add Rule')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('crisisSupport.admin.intent', 'Intent')}</TableHead>
                  <TableHead>{t('crisisSupport.admin.riskLevel', 'Risk Level')}</TableHead>
                  <TableHead>{t('crisisSupport.admin.action', 'Action')}</TableHead>
                  <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium capitalize">
                      {t(`crisisSupport.intents.${m.intent}`, m.intent.replace(/_/g, ' '))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={riskBadgeVariant(m.risk_level)}>{m.risk_level.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.action_description
                        ? m.action_description
                        : m.risk_level === 'high'
                          ? t('crisisSupport.admin.highRiskAction', 'Immediate escalation & first aider dispatch')
                          : t('crisisSupport.admin.normalAction', 'Standard crisis support flow')}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(m)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!mappings || mappings.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {t('crisisSupport.admin.noMappings', 'No risk mappings configured. Add one to get started.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          <div className="mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">{t('crisisSupport.admin.highRiskNote', 'High Risk Note')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('crisisSupport.admin.highRiskNoteDesc', 'High-risk intents trigger immediate escalation and first aider dispatch.')}</p>
          </div>
        </CardContent>
      </Card>

      <RiskMappingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mapping={editing}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('crisisSupport.admin.deleteMapping', 'Delete Risk Mapping')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.is_default
                ? t('crisisSupport.admin.deleteDefaultWarning', 'This is a system default mapping. Deleting it may affect crisis routing.')
                : t('crisisSupport.admin.deleteConfirm', 'Are you sure you want to delete this risk mapping?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
