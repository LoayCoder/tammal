import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/hooks/useEmployees";

interface ManagerSelectProps {
  employees: Employee[];
  value?: string;
  onChange: (value: string | undefined) => void;
  excludeId?: string;
  disabled?: boolean;
}

export function ManagerSelect({ employees, value, onChange, excludeId, disabled }: ManagerSelectProps) {
  const { t } = useTranslation();

  const filteredEmployees = employees.filter(emp => emp.id !== excludeId && emp.status === 'active');

  return (
    <Select 
      value={value || "none"} 
      onValueChange={(val) => onChange(val === "none" ? undefined : val)} 
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('employees.selectManager')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{t('employees.noManager')}</SelectItem>
        {filteredEmployees.map((emp) => (
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
