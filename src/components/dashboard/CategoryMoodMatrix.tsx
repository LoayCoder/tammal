import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CategoryMoodCell } from '@/lib/wellnessAnalytics';

interface Props {
  data: CategoryMoodCell[];
  isLoading: boolean;
}

const MOOD_LEVELS = ['great', 'good', 'okay', 'struggling', 'need_help'];

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return 'hsl(var(--muted))';
  const intensity = count / Math.max(maxCount, 1);
  if (intensity > 0.7) return 'hsl(var(--destructive) / 0.8)';
  if (intensity > 0.4) return 'hsl(var(--chart-4) / 0.7)';
  if (intensity > 0.1) return 'hsl(var(--chart-2) / 0.6)';
  return 'hsl(var(--chart-2) / 0.3)';
}

export function CategoryMoodMatrix({ data, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.categoryMoodMatrix')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
      </Card>
    );
  }

  // Group by category
  const categoryMap = new Map<string, { name: string; nameAr: string | null; cells: Map<string, CategoryMoodCell> }>();
  data.forEach(cell => {
    if (!categoryMap.has(cell.categoryId)) {
      categoryMap.set(cell.categoryId, { name: cell.categoryName, nameAr: cell.categoryNameAr, cells: new Map() });
    }
    categoryMap.get(cell.categoryId)!.cells.set(cell.moodLevel, cell);
  });

  const categories = Array.from(categoryMap.entries());
  const maxCount = Math.max(1, ...data.map(d => d.count));

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t('orgDashboard.categoryMoodMatrix')}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-sm text-center py-10">{t('orgDashboard.noSurveyData')}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('orgDashboard.categoryMoodMatrix')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-start p-2 font-medium text-muted-foreground">{t('orgDashboard.categoryHealth')}</th>
                {MOOD_LEVELS.map(mood => (
                  <th key={mood} className="p-2 text-center font-medium text-muted-foreground">
                    {t(`orgDashboard.moods.${mood}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TooltipProvider>
                {categories.map(([catId, cat]) => (
                  <tr key={catId} className="border-t border-border/50">
                    <td className="p-2 font-medium text-sm truncate max-w-[140px]">
                      {isRTL && cat.nameAr ? cat.nameAr : cat.name}
                    </td>
                    {MOOD_LEVELS.map(mood => {
                      const cell = cat.cells.get(mood);
                      const count = cell?.count ?? 0;
                      return (
                        <td key={mood} className="p-1 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="mx-auto w-10 h-10 rounded flex items-center justify-center text-[10px] font-medium cursor-default transition-transform hover:scale-110"
                                style={{ backgroundColor: getIntensityColor(count, maxCount), color: count > maxCount * 0.4 ? 'hsl(var(--card))' : 'hsl(var(--foreground))' }}
                              >
                                {count || '—'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isRTL && cat.nameAr ? cat.nameAr : cat.name} × {t(`orgDashboard.moods.${mood}`)}</p>
                              <p>{t('orgDashboard.count')}: {count}</p>
                              {cell?.avgScore ? <p>{t('orgDashboard.avgScore')}: {cell.avgScore}/5</p> : null}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </TooltipProvider>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
