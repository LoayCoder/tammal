import { useTranslation } from 'react-i18next';
import { useEmployeesList } from '@/hooks/org/useEmployeesList';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface EmployeePickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  departmentId?: string | null;
  placeholder?: string;
  disabled?: boolean;
}

export function EmployeePicker({ value, onChange, departmentId, placeholder, disabled }: EmployeePickerProps) {
  const { t } = useTranslation();
  const { data: employees = [] } = useEmployeesList(departmentId);

  return (
    <Select
      value={value || 'none'}
      onValueChange={(v) => onChange(v === 'none' ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder || t('workload.assignment.selectEmployee')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('workload.assignment.none')}</SelectItem>
        {employees.map((emp) => (
          <SelectItem key={emp.id} value={emp.id}>
            <div className="flex flex-col">
              <span>{emp.full_name}</span>
              {emp.role_title && (
                <span className="text-xs text-muted-foreground">{emp.role_title}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
