import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

interface CriteriaRow {
  name: string;
  name_ar?: string | null;
  description?: string | null;
  weight: number; // percentage
}

interface CriteriaWeightTableProps {
  criteria: CriteriaRow[];
  label?: string;
}

export function CriteriaWeightTable({ criteria, label }: CriteriaWeightTableProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      )}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-start p-2 font-medium">{t('recognition.criteria.name')}</th>
              <th className="text-end p-2 font-medium w-20">{t('recognition.criteria.weight')}</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((c, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-2">
                  <span className="font-medium">{isAr && c.name_ar ? c.name_ar : c.name}</span>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  )}
                </td>
                <td className="p-2 text-end">
                  <Badge variant="secondary" className="text-xs">{c.weight}%</Badge>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30">
              <td className="p-2 font-medium">{t('recognition.criteria.totalWeight')}</td>
              <td className="p-2 text-end">
                <Badge variant={Math.abs(totalWeight - 100) < 0.5 ? 'default' : 'destructive'}>
                  {totalWeight}%
                </Badge>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
