import { useTranslation } from 'react-i18next';
import { useBranches } from '@/hooks/useBranches';
import { useDivisions } from '@/hooks/useDivisions';
import { useDepartments } from '@/hooks/useDepartments';
import { useSites } from '@/hooks/useSites';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { OrgFilter } from '@/hooks/useOrgAnalytics';
import { useMemo } from 'react';

interface OrgFilterBarProps {
  value: OrgFilter;
  onChange: (filter: OrgFilter) => void;
}

export function OrgFilterBar({ value, onChange }: OrgFilterBarProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { branches } = useBranches();
  const { divisions } = useDivisions();
  const { departments } = useDepartments();
  const { sites } = useSites();

  const hasFilters = !!(value.branchId || value.divisionId || value.departmentId || value.sectionId);

  // Cascade: filter departments by division
  const filteredDepartments = useMemo(() => {
    if (value.divisionId) return departments.filter(d => d.division_id === value.divisionId);
    return departments;
  }, [departments, value.divisionId]);

  // Cascade: filter sections by department
  const filteredSections = useMemo(() => {
    if (value.departmentId) return sites.filter(s => s.department_id === value.departmentId);
    return sites;
  }, [sites, value.departmentId]);

  const activeCount = [value.branchId, value.divisionId, value.departmentId, value.sectionId].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          {hasFilters && (
            <Badge variant="secondary" className="text-xs">
              {activeCount} {t('orgDashboard.filtersActive')}
            </Badge>
          )}
        </div>

        {/* Branch */}
        <Select
          value={value.branchId || '__all__'}
          onValueChange={(v) => {
            const branchId = v === '__all__' ? undefined : v;
            onChange({ branchId, divisionId: undefined, departmentId: undefined, sectionId: undefined });
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder={t('orgDashboard.filterByBranch')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('orgDashboard.allBranches')}</SelectItem>
            {branches.map(b => (
              <SelectItem key={b.id} value={b.id}>{isAr ? (b.name_ar || b.name) : b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Division */}
        <Select
          value={value.divisionId || '__all__'}
          onValueChange={(v) => {
            const divisionId = v === '__all__' ? undefined : v;
            onChange({ ...value, divisionId, departmentId: undefined, sectionId: undefined });
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder={t('orgDashboard.filterByDivision')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('orgDashboard.allDivisions')}</SelectItem>
            {divisions.map(d => (
              <SelectItem key={d.id} value={d.id}>{isAr ? (d.name_ar || d.name) : d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department */}
        <Select
          value={value.departmentId || '__all__'}
          onValueChange={(v) => {
            const departmentId = v === '__all__' ? undefined : v;
            onChange({ ...value, departmentId, sectionId: undefined });
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder={t('orgDashboard.filterByDepartment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('orgDashboard.allDepartments')}</SelectItem>
            {filteredDepartments.map(d => (
              <SelectItem key={d.id} value={d.id}>{isAr ? (d.name_ar || d.name) : d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Section */}
        <Select
          value={value.sectionId || '__all__'}
          onValueChange={(v) => {
            const sectionId = v === '__all__' ? undefined : v;
            onChange({ ...value, sectionId });
          }}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder={t('orgDashboard.filterBySection')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('orgDashboard.allSections')}</SelectItem>
            {filteredSections.map(s => (
              <SelectItem key={s.id} value={s.id}>{isAr ? (s.name_ar || s.name) : s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => onChange({})}
          >
            <X className="h-3.5 w-3.5" />
            {t('orgDashboard.clearFilters')}
          </Button>
        )}
      </div>
    </div>
  );
}
