import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import type { BatchQuestion } from '@/hooks/questions/useQuestionBatches';

function ExpandableBatchText({ text, dir }: { text: string; dir?: string }) {
  if (!text || text === '—') return <span className="text-muted-foreground">—</span>;
  const isTruncated = text.length > 50;
  if (!isTruncated) return <p className="text-sm" dir={dir}>{text}</p>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className="text-sm line-clamp-2 cursor-help" dir={dir}>{text}</p>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm whitespace-pre-wrap">
        <p className="text-sm" dir={dir}>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface BatchQuestionTableProps {
  questions: BatchQuestion[];
  batchId: string;
  purpose: string;
  selectedIds: Set<string>;
  onToggle: (batchId: string, questionId: string) => void;
  onToggleAll: (batchId: string, questions: BatchQuestion[]) => void;
  onViewQuestion: (question: BatchQuestion) => void;
  statusColor: (status: string) => string;
  statusLabel: (status: string) => string;
  typeLabel: (type: string) => string;
}

export function BatchQuestionTable({
  questions, batchId, purpose, selectedIds,
  onToggle, onToggleAll, onViewQuestion,
  statusColor, statusLabel, typeLabel,
}: BatchQuestionTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={questions.length > 0 && selectedIds.size === questions.length}
                onCheckedChange={() => onToggleAll(batchId, questions)}
              />
            </TableHead>
            <TableHead className="w-8">#</TableHead>
            <TableHead>{t('batches.questionText')}</TableHead>
            <TableHead>{t('batches.questionTextAr')}</TableHead>
            <TableHead className="w-24">{t('batches.type')}</TableHead>
            {purpose !== 'wellness' && (
              <TableHead className="w-24">{t('batches.confidence')}</TableHead>
            )}
            <TableHead className="w-24">{t('common.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((q, idx) => {
            const isInactive = q.validation_status === 'inactive';
            const isSelected = selectedIds.has(q.id);
            return (
              <TableRow key={q.id} className={isInactive ? 'opacity-50' : ''}>
                <TableCell>
                  <Checkbox checked={isSelected} onCheckedChange={() => onToggle(batchId, q.id)} />
                </TableCell>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" onClick={() => onViewQuestion(q)}>
                  <ExpandableBatchText text={q.question_text} />
                </TableCell>
                <TableCell className="max-w-xs cursor-pointer hover:bg-muted/50" onClick={() => onViewQuestion(q)}>
                  <ExpandableBatchText text={q.question_text_ar || '—'} dir="rtl" />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{typeLabel(q.type)}</Badge>
                </TableCell>
                {purpose !== 'wellness' && (
                  <TableCell>
                    {q.confidence_score != null ? `${q.confidence_score}%` : '—'}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${statusColor(q.validation_status || 'pending')}`}>
                    {statusLabel(q.validation_status || 'pending')}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
