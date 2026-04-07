import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { MessageCircle, Users, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useTenantId } from "@/hooks/org/useTenantId";
import { useEngagementActionLog } from "../hooks/useEngagementActionLog";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface DirectReport {
  id: string;
  full_name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  directReports: DirectReport[];
}

export function BulkCheckinReminder({ open, onOpenChange, directReports }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();
  const { logAction } = useEngagementActionLog();
  const [isSending, setIsSending] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch which direct reports already checked in today
  const { data: checkedInIds = [], isPending: isLoadingCheckins } = useQuery({
    queryKey: ["bulk-checkin-today", tenantId, today, directReports.map(r => r.id)],
    queryFn: async () => {
      if (directReports.length === 0) return [];
      const { data } = await supabase
        .from("mood_entries")
        .select("employee_id")
        .eq("entry_date", today)
        .in("employee_id", directReports.map(r => r.id));
      return (data ?? []).map(d => d.employee_id);
    },
    enabled: open && !!tenantId && directReports.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const uncheckedMembers = directReports.filter(r => !checkedInIds.includes(r.id));

  const handleSendAll = async () => {
    if (!employee || !tenantId || uncheckedMembers.length === 0) return;
    setIsSending(true);
    try {
      const notifications = uncheckedMembers.map(member => ({
        tenant_id: tenantId,
        recipient_id: member.id,
        title: isAr ? "تسجيل الحالة" : "Check-in Reminder",
        body: isAr
          ? `${employee.full_name} يطلب منك تسجيل حالتك اليوم`
          : `${employee.full_name} wants to check in with you`,
        type: "check_in_prompt" as const,
        action_path: "/wellness",
      }));

      const { error } = await supabase
        .from("engagement_notifications")
        .insert(notifications);

      if (error) throw error;

      logAction.mutate({
        actionType: "checkin_from_nudge",
        source: "pulse_card",
        metadata: { bulkCount: uncheckedMembers.length, memberIds: uncheckedMembers.map(m => m.id) },
      });

      toast.success(
        isAr
          ? `تم إرسال تذكير التسجيل إلى ${uncheckedMembers.length} أعضاء`
          : `Sent check-in reminders to ${uncheckedMembers.length} team members`
      );
      onOpenChange(false);
    } catch {
      toast.error(isAr ? "فشل في إرسال التذكيرات" : "Failed to send reminders");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-start">
            <MessageCircle className="h-5 w-5 text-primary" strokeWidth={1.5} />
            {isAr ? "إرسال تذكير التسجيل" : "Send Check-in Reminders"}
          </DialogTitle>
          <DialogDescription className="text-start">
            {isAr
              ? "أرسل تذكيرًا لأعضاء فريقك الذين لم يسجلوا حالتهم اليوم"
              : "Send a reminder to team members who haven't checked in today"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {isLoadingCheckins ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : uncheckedMembers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle className="h-8 w-8 text-chart-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">
                {isAr ? "جميع أعضاء الفريق سجلوا حالتهم اليوم!" : "All team members have checked in today!"}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                {isAr
                  ? `${uncheckedMembers.length} عضو لم يسجلوا حالتهم بعد`
                  : `${uncheckedMembers.length} member${uncheckedMembers.length > 1 ? "s" : ""} haven't checked in yet`}
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/30">
                {uncheckedMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                    <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{member.full_name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {uncheckedMembers.length > 0 && !isLoadingCheckins && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSendAll}
              disabled={isSending}
              className="gap-1.5 text-xs"
            >
              {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              {isAr
                ? `إرسال للجميع (${uncheckedMembers.length})`
                : `Send to All (${uncheckedMembers.length})`}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
