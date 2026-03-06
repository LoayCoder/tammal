import { useTranslation } from 'react-i18next';
import { EmployeePicker } from '@/components/workload/EmployeePicker';
import { Badge } from '@/components/ui/badge';
import { User, UserCheck, Shield, Eye } from 'lucide-react';

interface TaskMembersPickerProps {
  assigneeId: string | null;
  reviewerId: string | null;
  approverId: string | null;
  onAssigneeChange: (id: string | null) => void;
  onReviewerChange: (id: string | null) => void;
  onApproverChange: (id: string | null) => void;
  departmentId?: string | null;
  disabled?: boolean;
}

export function TaskMembersPicker({
  assigneeId, reviewerId, approverId,
  onAssigneeChange, onReviewerChange, onApproverChange,
  departmentId, disabled,
}: TaskMembersPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {t('tasks.members.assignee')}
          <Badge variant="destructive" className="text-2xs h-4 px-1">*</Badge>
        </label>
        <EmployeePicker value={assigneeId} onChange={onAssigneeChange} departmentId={departmentId} disabled={disabled} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5" />
          {t('tasks.members.reviewer')}
        </label>
        <EmployeePicker value={reviewerId} onChange={onReviewerChange} departmentId={departmentId} disabled={disabled} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5" />
          {t('tasks.members.approver')}
        </label>
        <EmployeePicker value={approverId} onChange={onApproverChange} departmentId={departmentId} disabled={disabled} />
      </div>
    </div>
  );
}
