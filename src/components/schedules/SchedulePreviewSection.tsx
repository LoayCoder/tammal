/**
 * SchedulePreviewSection — audience detail viewer dialog.
 * Extracted from ScheduleManagement.tsx. ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Check, X } from 'lucide-react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';
import type { AudienceResult } from '@/hooks/admin/useAudienceResolver';

interface SchedulePreviewSectionProps {
  audienceViewSchedule: QuestionSchedule | null;
  onClose: () => void;
  audienceViewResult: AudienceResult | null;
  filteredAudienceList: Array<{ id: string; full_name: string; email: string; department: string | null; included: boolean }>;
  audienceSearch: string;
  onSearchChange: (value: string) => void;
}

export default function SchedulePreviewSection({
  audienceViewSchedule,
  onClose,
  audienceViewResult,
  filteredAudienceList,
  audienceSearch,
  onSearchChange,
}: SchedulePreviewSectionProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={!!audienceViewSchedule} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('schedules.audienceDetails')}</DialogTitle>
          <DialogDescription>
            {audienceViewSchedule?.name}
          </DialogDescription>
        </DialogHeader>
        {audienceViewResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <span className="text-sm font-medium">{t('schedules.audienceSummary')}</span>
              <Badge variant="secondary">
                {t('schedules.includedCount', {
                  included: audienceViewResult.includedCount,
                  total: audienceViewResult.totalEligible,
                })}
              </Badge>
            </div>
            {audienceViewResult.totalEligible > 0 && (
              <Progress
                value={(audienceViewResult.includedCount / audienceViewResult.totalEligible) * 100}
                className="h-2"
              />
            )}
            {audienceViewResult.includedCount === audienceViewResult.totalEligible && audienceViewResult.totalEligible > 0 && (
              <p className="text-sm text-muted-foreground">{t('schedules.allIncluded')}</p>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('schedules.searchAudience')}
                value={audienceSearch}
                onChange={e => onSearchChange(e.target.value)}
                className="ps-8"
              />
            </div>

            {/* Employee List */}
            <ScrollArea className="max-h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employees.name')}</TableHead>
                    <TableHead>{t('employees.email')}</TableHead>
                    <TableHead>{t('employees.department')}</TableHead>
                    <TableHead className="text-end">{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudienceList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAudienceList.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="text-sm font-medium">{emp.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{emp.email}</TableCell>
                        <TableCell className="text-sm">{emp.department || '—'}</TableCell>
                        <TableCell className="text-end">
                          {emp.included ? (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              {t('schedules.included')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <X className="h-3 w-3" />
                              {t('schedules.notIncluded')}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
