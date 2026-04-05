import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";
import { Heart, Send, Users, Lightbulb, Shield, Award, Star, ChevronDown } from "lucide-react";
import { useAppreciations, type AppreciationCategory } from "../hooks/useAppreciations";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

const CATEGORIES: { key: AppreciationCategory; icon: typeof Heart; labelKey: string; color: string }[] = [
  { key: "teamwork", icon: Users, labelKey: "pulse.catTeamwork", color: "text-chart-1" },
  { key: "innovation", icon: Lightbulb, labelKey: "pulse.catInnovation", color: "text-chart-2" },
  { key: "support", icon: Shield, labelKey: "pulse.catSupport", color: "text-chart-4" },
  { key: "leadership", icon: Award, labelKey: "pulse.catLeadership", color: "text-primary" },
  { key: "above_beyond", icon: Star, labelKey: "pulse.catAboveBeyond", color: "text-chart-3" },
];

export function QuickAppreciationCard() {
  const { t } = useTranslation();
  const { employee } = useCurrentEmployee();
  const { sendAppreciation, receivedCount } = useAppreciations();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<AppreciationCategory>("teamwork");
  const [sending, setSending] = useState(false);

  // Fetch colleagues
  const { data: colleagues = [] } = useQuery({
    queryKey: ["colleagues", employee?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("tenant_id", employee!.tenant_id)
        .is("deleted_at", null)
        .eq("status", "active")
        .neq("id", employee!.id)
        .order("full_name")
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!employee?.tenant_id,
    staleTime: 1000 * 60 * 10,
  });

  const handleSend = async () => {
    if (!selectedEmployee || !message.trim()) return;
    setSending(true);
    try {
      await sendAppreciation.mutateAsync({
        toEmployeeId: selectedEmployee,
        message: message.trim(),
        category,
      });
      setSelectedEmployee("");
      setMessage("");
      setCategory("teamwork");
    } finally {
      setSending(false);
    }
  };

  return (
    <Collapsible className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden")}>
      <CollapsibleTrigger className="group flex items-center justify-between w-full p-4 cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-3/15 to-chart-1/10">
            <Heart className="h-4 w-4 text-chart-3" strokeWidth={1.5} />
          </div>
          <div className="text-start">
            <h3 className="text-sm font-bold text-foreground">{t("pulse.appreciateTitle")}</h3>
            <p className="text-[10px] text-muted-foreground">
              {receivedCount > 0
                ? t("pulse.appreciationsReceived", { count: receivedCount })
                : t("pulse.appreciateSubtitle")}
            </p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4">
        <div className="space-y-3">
          {/* Colleague selector */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 h-11 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            <option value="">{t("pulse.selectColleague")}</option>
            {colleagues.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2.5 py-2 sm:py-1.5 text-2xs font-medium transition-all duration-200 active:scale-[0.97]",
                    active
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "bg-muted/10 text-muted-foreground hover:bg-muted/20"
                  )}
                >
                  <Icon className={cn("h-3 w-3", active ? "text-primary" : cat.color)} strokeWidth={1.5} />
                  {t(cat.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Message */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("pulse.appreciationPlaceholder")}
            rows={2}
            maxLength={300}
            autoComplete="off"
            enterKeyHint="send"
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!selectedEmployee || !message.trim() || sending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
              selectedEmployee && message.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted/10 text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            {sending ? t("common.loading") : t("pulse.sendAppreciation")}
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
