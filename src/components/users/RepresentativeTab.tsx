import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useRepresentativeAdmin, type CreateRepresentativeInput } from '@/hooks/org/useRepresentativeAdmin';
import { useOrgTree } from '@/hooks/org/useOrgTree';
import { useEmployeesWithUser } from '@/hooks/org/useEmployeesList';

interface RepresentativeTabProps {
  tenantId: string;
}

export function RepresentativeTab({ tenantId }: RepresentativeTabProps) {
  const { t } = useTranslation();
  const { assignments, isPending, create, isCreating, remove, isRemoving } = useRepresentativeAdmin(tenantId);
  const { divisions, departments, sites, getDepartmentsByDivision, getSitesByDepartment } = useOrgTree();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add dialog state
  const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState('');
  const [scopeType, setScopeType] = useState<'division' | 'department' | 'section'>('division');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Get employees with user_id for assignment
  const { data: employees = [] } = useEmployeesWithUser(tenantId);

  // Employee lookup map
  const employeeByUserId = useMemo(() => {
    const map = new Map<string, (typeof employees)[0]>();
    employees.forEach(e => map.set(e.user_id, e));
    return map;
  }, [employees]);

  const filteredDepartments = useMemo(
    () => selectedDivisionId ? getDepartmentsByDivision(selectedDivisionId) : [],
    [selectedDivisionId, getDepartmentsByDivision],
  );

  const filteredSections = useMemo(
    () => selectedDepartmentId ? getSitesByDepartment(selectedDepartmentId) : [],
    [selectedDepartmentId, getSitesByDepartment],
  );

  const scopeId = scopeType === 'division' ? selectedDivisionId
    : scopeType === 'department' ? selectedDepartmentId
    : selectedSectionId;

  const getScopeName = (type: string, id: string) => {
    if (type === 'division') return divisions.find(d => d.id === id)?.name ?? id;
    if (type === 'department') return departments.find(d => d.id === id)?.name ?? id;
    if (type === 'section') return sites.find(s => s.id === id)?.name ?? id;
    return id;
  };

  const handleAdd = async () => {
    if (!selectedEmployeeUserId || !scopeId) return;
    const input: CreateRepresentativeInput = {
      user_id: selectedEmployeeUserId,
      scope_type: scopeType,
      scope_id: scopeId,
    };
    await create(input);
    resetDialog();
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setSelectedEmployeeUserId('');
    setScopeType('division');
    setSelectedDivisionId('');
    setSelectedDepartmentId('');
    setSelectedSectionId('');
  };

  if (isPending) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <>
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{t('representative.admin.title')}</CardTitle>
              <CardDescription>{t('representative.admin.description')}</CardDescription>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 me-2" />
              {t('representative.admin.addRepresentative')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t('representative.admin.noAssignments')}
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-start px-3 py-2 font-medium">{t('representative.employee')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('representative.admin.scopeType')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('representative.admin.scopeName')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => {
                    const emp = employeeByUserId.get(a.user_id);
                    return (
                      <tr key={a.id} className="border-t">
                        <td className="px-3 py-2">{emp?.full_name ?? a.user_id}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary">{t(`representative.scopeTypes.${a.scope_type}`)}</Badge>
                        </td>
                        <td className="px-3 py-2">{getScopeName(a.scope_type, a.scope_id)}</td>
                        <td className="px-3 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(a.id)}
                            disabled={isRemoving}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Representative Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('representative.admin.addRepresentative')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Employee selector */}
            <div className="space-y-2">
              <Label>{t('representative.employee')}</Label>
              <Select value={selectedEmployeeUserId} onValueChange={setSelectedEmployeeUserId}>
                <SelectTrigger><SelectValue placeholder={t('representative.selectEmployee')} /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.user_id} value={e.user_id}>
                      {e.full_name} — {e.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope type */}
            <div className="space-y-2">
              <Label>{t('representative.admin.scopeType')}</Label>
              <Select value={scopeType} onValueChange={(v) => {
                setScopeType(v as 'division' | 'department' | 'section');
                setSelectedDivisionId('');
                setSelectedDepartmentId('');
                setSelectedSectionId('');
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="division">{t('representative.scopeTypes.division')}</SelectItem>
                  <SelectItem value="department">{t('representative.scopeTypes.department')}</SelectItem>
                  <SelectItem value="section">{t('representative.scopeTypes.section')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Division */}
            <div className="space-y-2">
              <Label>{t('representative.scopeTypes.division')}</Label>
              <Select value={selectedDivisionId} onValueChange={(v) => {
                setSelectedDivisionId(v);
                setSelectedDepartmentId('');
                setSelectedSectionId('');
              }}>
                <SelectTrigger><SelectValue placeholder={t('representative.selectDivision')} /></SelectTrigger>
                <SelectContent>
                  {divisions.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department (if scope is department or section) */}
            {(scopeType === 'department' || scopeType === 'section') && selectedDivisionId && (
              <div className="space-y-2">
                <Label>{t('representative.scopeTypes.department')}</Label>
                <Select value={selectedDepartmentId} onValueChange={(v) => {
                  setSelectedDepartmentId(v);
                  setSelectedSectionId('');
                }}>
                  <SelectTrigger><SelectValue placeholder={t('representative.selectDepartment')} /></SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Section (if scope is section) */}
            {scopeType === 'section' && selectedDepartmentId && (
              <div className="space-y-2">
                <Label>{t('representative.scopeTypes.section')}</Label>
                <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                  <SelectTrigger><SelectValue placeholder={t('representative.selectSection')} /></SelectTrigger>
                  <SelectContent>
                    {filteredSections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd} disabled={isCreating || !selectedEmployeeUserId || !scopeId}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
