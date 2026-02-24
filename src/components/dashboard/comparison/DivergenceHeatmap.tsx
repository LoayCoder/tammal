import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DepartmentBAIItem } from '@/lib/synthesisEngine';

interface Props {
  branchData: DepartmentBAIItem[];
  divisionData: DepartmentBAIItem[];
  departmentData: DepartmentBAIItem[];
  sectionData: DepartmentBAIItem[];
  isLoading: boolean;
}

const CELL_COLORS: Record<string, string> = {
  green: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700',
  yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-700',
  orange: 'bg-orange-500/20 border-orange-500/40 text-orange-700',
  red: 'bg-destructive/20 border-destructive/40 text-destructive',
};

function HeatmapGrid({ data, isAr }: { data: DepartmentBAIItem[]; isAr: boolean }) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">{t('synthesis.insufficientData')}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <TooltipProvider>
          {data.map(dept => (
            <Tooltip key={dept.id}>
              <TooltipTrigger asChild>
                <div className={`rounded-lg border p-3 text-center transition-colors ${CELL_COLORS[dept.classification]}`}>
                  <p className="text-xs font-medium truncate">{isAr ? (dept.nameAr || dept.name) : dept.name}</p>
                  <p className="text-xl font-bold mt-1">{(dept.baiScore * 100).toFixed(0)}%</p>
                  <p className="text-[10px] opacity-70">{t(`synthesis.risk.${dept.classification}`)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>{t('synthesis.checkinAvg')}: {dept.checkinAvg.toFixed(1)}/5</p>
                  <p>{t('synthesis.surveyAvg')}: {dept.surveyAvg.toFixed(1)}/5</p>
                  <p>{t('orgDashboard.employees')}: {dept.employeeCount}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
        {(['green', 'yellow', 'orange', 'red'] as const).map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm border ${CELL_COLORS[c]}`} />
            <span className="text-xs text-muted-foreground">{t(`synthesis.risk.${c}`)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function DivergenceHeatmap({ branchData, divisionData, departmentData, sectionData, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{t('synthesis.heatmapTitle')}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const tabs = [
    { key: 'branch', label: t('synthesis.heatmapBranch'), data: branchData },
    { key: 'division', label: t('synthesis.heatmapDivision'), data: divisionData },
    { key: 'department', label: t('synthesis.heatmapDepartment'), data: departmentData },
    { key: 'section', label: t('synthesis.heatmapSection'), data: sectionData },
  ];

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('synthesis.heatmapTitle')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('synthesis.heatmapDesc')}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="department">
          <TabsList className="mb-4">
            {tabs.map(tab => (
              <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(tab => (
            <TabsContent key={tab.key} value={tab.key}>
              <HeatmapGrid data={tab.data} isAr={isAr} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
