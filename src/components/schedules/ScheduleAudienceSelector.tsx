/**
 * ScheduleAudienceSelector — audience type radio, department/employee pickers, live summary.
 * Extracted from ScheduleManagement.tsx dialog body. ZERO behaviour change.
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Users, Building2, UserCheck, Search } from 'lucide-react';
import type { ScheduleFormState } from '@/hooks/admin/useScheduleReducer';
import type { AudienceResult, AudienceEmployee } from '@/hooks/admin/useAudienceResolver';

interface ScheduleAudienceSelectorProps {
  state: ScheduleFormState;
  setField: <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => void;
  availableDepartments: string[];
  availableEmployees: AudienceEmployee[];
  dialogAudienceSummary: AudienceResult;
}

export default function ScheduleAudienceSelector({
  state,
  setField,
  availableDepartments,
  availableEmployees,
  dialogAudienceSummary,
}: ScheduleAudienceSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Label>{t('schedules.audienceType')}</Label>
      <RadioGroup
        value={state.audienceType}
        onValueChange={(val) => setField('audienceType', val as 'all' | 'departments' | 'specific')}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="audience-all" />
          <Label htmlFor="audience-all" className="font-normal cursor-pointer flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {t('schedules.allEmployees')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="departments" id="audience-dept" />
          <Label htmlFor="audience-dept" className="font-normal cursor-pointer flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {t('schedules.byDepartment')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="specific" id="audience-specific" />
          <Label htmlFor="audience-specific" className="font-normal cursor-pointer flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" />
            {t('schedules.specificEmployees')}
          </Label>
        </div>
      </RadioGroup>

      {state.audienceType === 'departments' && (
        <div className="border rounded-md p-3 space-y-2">
          {availableDepartments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('schedules.noDepartmentsYet')}</p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {availableDepartments.map(dept => (
                  <label key={dept} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={state.selectedDepartments.includes(dept)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setField('selectedDepartments', [...state.selectedDepartments, dept]);
                        } else {
                          setField('selectedDepartments', state.selectedDepartments.filter(d => d !== dept));
                        }
                      }}
                    />
                    <span className="text-sm">{dept}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}
          {state.selectedDepartments.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('schedules.departmentsSelected', { count: state.selectedDepartments.length })}
            </p>
          )}
        </div>
      )}

      {state.audienceType === 'specific' && (
        <div className="border rounded-md p-3 space-y-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('schedules.searchEmployees')}
              value={state.employeeSearch}
              onChange={e => setField('employeeSearch', e.target.value)}
              className="ps-8 h-9"
            />
          </div>
          {availableEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('schedules.noEmployeesYet')}</p>
          ) : (
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {availableEmployees
                  .filter(emp =>
                    !state.employeeSearch ||
                    emp.full_name.toLowerCase().includes(state.employeeSearch.toLowerCase()) ||
                    emp.email.toLowerCase().includes(state.employeeSearch.toLowerCase())
                  )
                  .map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer">
                      <Checkbox
                        checked={state.selectedEmployees.includes(emp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setField('selectedEmployees', [...state.selectedEmployees, emp.id]);
                          } else {
                            setField('selectedEmployees', state.selectedEmployees.filter(id => id !== emp.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm block truncate">{emp.full_name}</span>
                        <span className="text-xs text-muted-foreground block truncate">{emp.email}</span>
                      </div>
                      {emp.department && (
                        <Badge variant="outline" className="text-xs shrink-0">{emp.department}</Badge>
                      )}
                    </label>
                  ))}
              </div>
            </ScrollArea>
          )}
          {state.selectedEmployees.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('schedules.employeesSelected', { count: state.selectedEmployees.length })}
            </p>
          )}
        </div>
      )}

      {/* Live Audience Summary Card */}
      <div className="border rounded-md p-3 bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('schedules.audienceSummary')}</span>
          <Badge variant="secondary" className="text-xs">
            {t('schedules.includedCount', {
              included: dialogAudienceSummary.includedCount,
              total: dialogAudienceSummary.totalEligible,
            })}
          </Badge>
        </div>
        {dialogAudienceSummary.totalEligible > 0 && (
          <Progress
            value={(dialogAudienceSummary.includedCount / dialogAudienceSummary.totalEligible) * 100}
            className="h-2"
          />
        )}
        {dialogAudienceSummary.includedCount === dialogAudienceSummary.totalEligible && dialogAudienceSummary.totalEligible > 0 && (
          <p className="text-xs text-muted-foreground">{t('schedules.allIncluded')}</p>
        )}
      </div>
    </div>
  );
}
