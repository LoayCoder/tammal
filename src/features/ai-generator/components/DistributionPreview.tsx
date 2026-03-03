import { useTranslation } from 'react-i18next';

interface DistributionPreviewProps {
  subcategories: { id: string; name: string; name_ar: string | null }[];
  questionCount: number;
}

export function DistributionPreview({ subcategories, questionCount }: DistributionPreviewProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (subcategories.length === 0 || questionCount === 0) return null;

  const perSub = Math.max(1, Math.floor(questionCount / subcategories.length));
  const perState = Math.max(1, Math.round(perSub / 3));

  const states = [
    { key: 'positive', label: t('aiGenerator.affective_positive'), color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
    { key: 'neutral', label: t('aiGenerator.affective_neutral'), color: 'bg-muted text-muted-foreground' },
    { key: 'negative', label: t('aiGenerator.affective_negative'), color: 'bg-destructive/20 text-destructive' },
  ];

  const getLabel = (s: { name: string; name_ar: string | null }) =>
    isRTL && s.name_ar ? s.name_ar : s.name;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t('aiGenerator.distributionPreview')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-start py-1 pe-2 font-medium text-muted-foreground">{t('aiGenerator.subcategory')}</th>
              {states.map(s => (
                <th key={s.key} className="text-center py-1 px-1 font-medium text-muted-foreground whitespace-nowrap">
                  {s.label.split('/')[0].trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subcategories.map(sub => (
              <tr key={sub.id} className="border-t border-border/50">
                <td className="py-1.5 pe-2 truncate max-w-[120px]">{getLabel(sub)}</td>
                {states.map(s => (
                  <td key={s.key} className="text-center py-1.5 px-1">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-semibold ${s.color}`}>
                      {perState}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        ≈ {perSub} × {subcategories.length} = {perSub * subcategories.length} questions (target)
      </p>
    </div>
  );
}
