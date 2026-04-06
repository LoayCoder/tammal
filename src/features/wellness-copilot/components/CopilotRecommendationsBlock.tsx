import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity, Brain, Wind, BookOpen, Music,
  CheckSquare, BookMarked, ClipboardCheck,
  HeartHandshake, Phone, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CopilotRecommendation } from "../hooks/useCopilotInsight";

const iconMap: Record<string, React.ComponentType<any>> = {
  mood_tracker: Activity,
  thought_reframer: Brain,
  breathing: Wind,
  journaling: BookOpen,
  meditation: Music,
  habits: CheckSquare,
  articles: BookMarked,
  assessment: ClipboardCheck,
  first_aider: HeartHandshake,
  crisis_support: Phone,
};

const typeStyles: Record<string, { border: string; iconBg: string; btnClass: string; label: string; labelAr: string }> = {
  practice: {
    border: "border-chart-1/20",
    iconBg: "bg-chart-1/10 text-chart-1",
    btnClass: "text-chart-1 hover:bg-chart-1/10",
    label: "Start",
    labelAr: "ابدأ",
  },
  resource: {
    border: "border-primary/20",
    iconBg: "bg-primary/10 text-primary",
    btnClass: "text-primary hover:bg-primary/10",
    label: "View",
    labelAr: "عرض",
  },
  support: {
    border: "border-destructive/20",
    iconBg: "bg-destructive/10 text-destructive",
    btnClass: "text-destructive hover:bg-destructive/10",
    label: "Contact",
    labelAr: "تواصل",
  },
};

interface Props {
  recommendations: CopilotRecommendation[];
}

export function CopilotRecommendationsBlock({ recommendations }: Props) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (!recommendations?.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {recommendations.slice(0, 4).map((rec) => {
        const Icon = iconMap[rec.key] ?? Sparkles;
        const style = typeStyles[rec.type] ?? typeStyles.resource;

        return (
          <button
            key={rec.key}
            type="button"
            onClick={() => navigate(rec.route)}
            className={cn(
              "group flex flex-col items-start gap-2 rounded-xl border p-3 text-start transition-all duration-200",
              "hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.98]",
              "bg-card/50",
              style.border
            )}
          >
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", style.iconBg)}>
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground leading-tight">{rec.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{rec.description}</p>
            </div>
            <span className={cn("text-[10px] font-medium mt-auto", style.btnClass)}>
              {isAr ? style.labelAr : style.label} <span className="rtl:hidden">→</span><span className="hidden rtl:inline">←</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
