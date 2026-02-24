import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useDivisions } from '@/hooks/useDivisions';
import { useDepartments } from '@/hooks/useDepartments';
import type { OrgFilters } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  filters: OrgFilters;
  onChange: (filters: OrgFilters) => void;
}

export function OrgFilterBar({ filters, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { branches } = useBranches();
  const { divisions } = useDivisions();
  const { departments } = useDepartments();

  // Filter departments based on selected division/branch
  const filteredDepartments = departments.filter(d => {
    if (filters.divisionId && d.division_id !== filters.divisionId) return false;
    if (filters.branchId && d.branch_id !== filters.branchId) return false;
    return true;
  });

  const hasFilters = filters.branchId || filters.divisionId || filters.departmentId;

  return (
    <div className="glass-card border-0 rounded-xl p-4 flex flex-wrap items-center gap-3">
      {/* Branch */}
      <Select
        value={filters.branchId ?? '__all__'}
        onValueChange={(v) => onChange({ ...filters, branchId: v === '__all__' ? undefined : v, departmentId: undefined })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('surveyMonitor.filters.branch')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('common.all')}</SelectItem>
          {branches.map(b => (
            <SelectItem key={b.id} value={b.id}>
              {isAr && b.name_ar ? b.name_ar : b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Division */}
      <Select
        value={filters.divisionId ?? '__all__'}
        onValueChange={(v) => onChange({ ...filters, divisionId: v === '__all__' ? undefined : v, departmentId: undefined })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('surveyMonitor.filters.division')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('common.all')}</SelectItem>
          {divisions.map(d => (
            <SelectItem key={d.id} value={d.id}>
              {isAr && d.name_ar ? d.name_ar : d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Department */}
      <Select
        value={filters.departmentId ?? '__all__'}
        onValueChange={(v) => onChange({ ...filters, departmentId: v === '__all__' ? undefined : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('surveyMonitor.filters.department')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t('common.all')}</SelectItem>
          {filteredDepartments.map(d => (
            <SelectItem key={d.id} value={d.id}>
              {isAr && d.name_ar ? d.name_ar : d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="gap-1"
        >
          <X className="h-3.5 w-3.5" />
          {t('common.clear')}
        </Button>
      )}
    </div>
  );
}
