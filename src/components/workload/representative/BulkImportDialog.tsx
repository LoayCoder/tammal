import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { parseCsv, type CsvRow } from './csvTemplate';
import { useResolveEmployeeEmails } from '@/hooks/org/useEmployeesList';
import type { BulkTaskPayload } from '@/features/workload/hooks/useRepresentativeTasks';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (tasks: BulkTaskPayload[]) => Promise<unknown>;
  isSubmitting: boolean;
}

interface ParsedRow extends CsvRow {
  employee_id?: string;
  valid: boolean;
  error?: string;
}

export function BulkImportDialog({ open, onOpenChange, onSubmit, isSubmitting }: BulkImportDialogProps) {
  const { t } = useTranslation();
  const { resolve } = useResolveEmployeeEmails();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [resolving, setResolving] = useState(false);

  const validCount = useMemo(() => rows.filter(r => r.valid).length, [rows]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseCsv(text);

    if (parsed.length === 0) {
      setRows([]);
      return;
    }

    // Resolve emails → employee IDs
    setResolving(true);
    const emails = [...new Set(parsed.map(r => r.employee_email?.toLowerCase()).filter(Boolean))];
    const emailMap = await resolve(emails);

    const resolved: ParsedRow[] = parsed.map(row => {
      if (!row.employee_email?.trim()) {
        return { ...row, valid: false, error: t('representative.bulkMissingEmail') };
      }
      if (!row.title?.trim()) {
        return { ...row, valid: false, error: t('representative.bulkMissingTitle') };
      }
      const empId = emailMap.get(row.employee_email.toLowerCase());
      if (!empId) {
        return { ...row, valid: false, error: t('representative.bulkEmployeeNotFound') };
      }
      return { ...row, employee_id: empId, valid: true };
    });

    setRows(resolved);
    setResolving(false);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.valid && r.employee_id);
    const tasks: BulkTaskPayload[] = validRows.map(r => ({
      employee_id: r.employee_id!,
      title: r.title,
      title_ar: r.title_ar || undefined,
      description: r.description || undefined,
      due_date: r.due_date || undefined,
      priority: r.priority ? parseInt(r.priority) : undefined,
      estimated_minutes: r.estimated_minutes ? parseInt(r.estimated_minutes) : undefined,
    }));

    await onSubmit(tasks);
    setRows([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('representative.bulkImport')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 me-2" />
              {t('representative.selectFile')}
            </Button>
            {resolving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* Preview table */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{t('representative.bulkTotal')}: {rows.length}</Badge>
                <Badge variant="default">{t('representative.bulkValid')}: {validCount}</Badge>
                {rows.length - validCount > 0 && (
                  <Badge variant="destructive">{t('representative.bulkInvalid')}: {rows.length - validCount}</Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-2 py-1.5 text-start">#</th>
                      <th className="px-2 py-1.5 text-start">{t('representative.bulkStatus')}</th>
                      <th className="px-2 py-1.5 text-start">Email</th>
                      <th className="px-2 py-1.5 text-start">{t('representative.taskTitle')}</th>
                      <th className="px-2 py-1.5 text-start">{t('representative.dueDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1.5">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          {row.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-chart-1" />
                          ) : (
                            <span className="flex items-center gap-1 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="truncate max-w-[120px]">{row.error}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5">{row.employee_email}</td>
                        <td className="px-2 py-1.5 max-w-[200px] truncate">{row.title}</td>
                        <td className="px-2 py-1.5">{row.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || validCount === 0}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {t('representative.importAndDistribute', { count: validCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
