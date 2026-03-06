import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface EmployeeOption {
  id: string;
  full_name: string;
  role_title: string | null;
  department_id: string | null;
}

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
  const { tenantId } = useTenantId();

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-picker', tenantId, departmentId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, full_name, role_title, department_id')
        .eq('tenant_id', tenantId!)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('full_name');
      if (departmentId) query = query.eq('department_id', departmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeOption[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

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
