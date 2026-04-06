import { useTranslation } from "react-i18next";
import { MessageCircle, Heart, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/org/useTenantId";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useEngagementActionLog } from "../hooks/useEngagementActionLog";
import { useAppreciations } from "../hooks/useAppreciations";
import { toast } from "sonner";

interface Props {
  memberId: string;
  memberName: string;
}

export function TeamMemberActions({ memberId, memberName }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const { logAction } = useEngagementActionLog();
  const { sendAppreciation } = useAppreciations();

  const handleCheckIn = async () => {
    if (!tenantId || !employee) return;
    try {
      await supabase.from("engagement_notifications").insert({
        tenant_id: tenantId,
        recipient_id: memberId,
        title: isAr ? "تسجيل الحالة" : "Check-in Reminder",
        body: isAr
          ? `${employee.full_name} يطلب منك تسجيل حالتك اليوم`
          : `${employee.full_name} wants to check in with you`,
        type: "check_in_prompt",
        action_path: "/wellness",
      });
      logAction.mutate({
        actionType: "checkin_from_nudge",
        source: "pulse_card",
        metadata: { targetEmployeeId: memberId },
      });
      toast.success(isAr ? "تم إرسال التنبيه" : "Check-in sent");
    } catch {
      toast.error(isAr ? "فشل الإرسال" : "Failed to send");
    }
  };

  const handleSupport = async () => {
    if (!employee) return;
    try {
      await sendAppreciation.mutateAsync({
        toEmployeeId: memberId,
        message: isAr
          ? `${employee.full_name} يقدر جهودك ويدعمك`
          : `${employee.full_name} appreciates your efforts and supports you`,
        category: "support",
      });
      logAction.mutate({
        actionType: "appreciation_sent",
        source: "pulse_card",
        metadata: { targetEmployeeId: memberId, type: "support" },
      });
      toast.success(isAr ? "تم إرسال الدعم" : "Support sent");
    } catch {
      // handled by mutation
    }
  };

  const btnCls = cn(
    "flex items-center gap-1 rounded-lg px-2 py-1 min-h-[32px]",
    "text-2xs font-medium transition-all duration-200",
    "hover:-translate-y-0.5 active:scale-[0.97]"
  );

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <button
        onClick={handleCheckIn}
        className={cn(btnCls, "bg-primary/10 text-primary border border-primary/15 hover:bg-primary/15")}
        title={isAr ? "إرسال تسجيل حالة" : "Send check-in"}
      >
        <MessageCircle className="h-3 w-3" strokeWidth={1.5} />
        {isAr ? "تسجيل" : "Check-in"}
      </button>
      <button
        onClick={handleSupport}
        disabled={sendAppreciation.isPending}
        className={cn(btnCls, "bg-chart-2/10 text-chart-2 border border-chart-2/15 hover:bg-chart-2/15 disabled:opacity-40")}
        title={isAr ? "إرسال دعم" : "Send support"}
      >
        <Heart className="h-3 w-3" strokeWidth={1.5} />
        {isAr ? "دعم" : "Support"}
      </button>
      <button
        onClick={() => navigate(`/admin/workload/team?employee=${memberId}`)}
        className={cn(btnCls, "bg-muted/10 text-muted-foreground border border-border/15 hover:bg-muted/20 hover:text-foreground")}
        title={isAr ? "عرض المهام" : "View workload"}
      >
        <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        {isAr ? "المهام" : "Tasks"}
      </button>
    </div>
  );
}
