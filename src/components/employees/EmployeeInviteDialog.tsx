import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/hooks/org/useEmployees";
import { Mail, User } from "lucide-react";

interface EmployeeInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSendInvite: (employeeId: string, email: string, fullName: string, expiryDays: number) => void;
  isLoading: boolean;
}

export function EmployeeInviteDialog({
  open,
  onOpenChange,
  employee,
  onSendInvite,
  isLoading,
}: EmployeeInviteDialogProps) {
  const { t } = useTranslation();
  const [expiryDays, setExpiryDays] = useState("7");

  if (!employee) return null;

  const handleSubmit = () => {
    onSendInvite(employee.id, employee.email, employee.full_name, parseInt(expiryDays));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('employees.sendInvite')}</DialogTitle>
          <DialogDescription>
            {t('employees.sendInviteDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{employee.full_name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {employee.email}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('invitations.expiresIn')}</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('expiryOptions.1day')}</SelectItem>
                <SelectItem value="7">{t('expiryOptions.7days')}</SelectItem>
                <SelectItem value="14">{t('expiryOptions.14days')}</SelectItem>
                <SelectItem value="30">{t('expiryOptions.30days')}</SelectItem>
                <SelectItem value="90">{t('expiryOptions.90days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <Mail className="h-4 w-4 me-2" />
            {isLoading ? t('common.loading') : t('employees.sendInvite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
