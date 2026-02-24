import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { EmployeeStatus } from "@/hooks/org/useEmployees";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus;
}

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  const { t } = useTranslation();

  const variants: Record<EmployeeStatus, "default" | "secondary" | "destructive"> = {
    active: "default",
    resigned: "secondary",
    terminated: "destructive",
  };

  return (
    <Badge variant={variants[status]}>
      {t(`employees.status.${status}`)}
    </Badge>
  );
}
