import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/hooks/useEmployees";

interface ManagerSelectProps {
  employees: Employee[];
  managerEligibleUserIds?: string[];
  value?: string;
  onChange: (value: string | undefined) => void;
  excludeId?: string;
  disabled?: boolean;
}

export function ManagerSelect({ employees, managerEligibleUserIds, value, onChange, excludeId, disabled }: ManagerSelectProps) {
  const { t } = useTranslation();

  const filteredEmployees = employees.filter(emp => {
    if (emp.id === excludeId) return false;
    if (emp.status !== 'active') return false;
    // If we have a list of eligible user IDs, only show employees linked to those users
    if (managerEligibleUserIds && managerEligibleUserIds.length > 0) {
      return emp.user_id != null && managerEligibleUserIds.includes(emp.user_id);
    }
    return true;
  });

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
