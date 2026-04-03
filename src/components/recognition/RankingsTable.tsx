import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import type { NomineeRanking } from '@/hooks/recognition/useResults';

interface RankingsTableProps {
  rankings: NomineeRanking[];
  nomineeNames: Record<string, string>;
}

const rankColors: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

export function RankingsTable({ rankings, nomineeNames }: RankingsTableProps) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">{t('recognition.results.rank')}</TableHead>
          <TableHead>{t('recognition.results.nominee')}</TableHead>
          <TableHead className="text-end">{t('recognition.results.weightedScore')}</TableHead>
          <TableHead className="text-end">{t('recognition.results.rawScore')}</TableHead>
          <TableHead className="text-end">{t('recognition.results.votes')}</TableHead>
          <TableHead className="text-end">{t('recognition.results.confidenceRange')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((r) => {
          const ci = r.confidence_interval as { lower?: number; upper?: number } | null;
          return (
            <TableRow key={r.id}>
              <TableCell>
                <div className="flex items-center gap-1">
                  {r.rank <= 3 && <Trophy className={`h-4 w-4 ${rankColors[r.rank] || ''}`} />}
                  <span className="font-medium">#{r.rank}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {nomineeNames[r.nomination_id] || t('common.noData')}
              </TableCell>
              <TableCell className="text-end">
                <Badge variant="secondary">{r.weighted_average_score?.toFixed(2) ?? '—'}</Badge>
              </TableCell>
              <TableCell className="text-end">{r.raw_average_score?.toFixed(2) ?? '—'}</TableCell>
              <TableCell className="text-end">{r.total_votes ?? 0}</TableCell>
              <TableCell className="text-end text-sm text-muted-foreground">
                {ci ? `${ci.lower?.toFixed(2)} – ${ci.upper?.toFixed(2)}` : '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
