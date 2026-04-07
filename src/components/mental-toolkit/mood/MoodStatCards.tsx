import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp, CalendarCheck, Activity } from "lucide-react";
import { TOOLKIT, ZONE_COLORS } from "@/config/toolkit-colors";
import { typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface MoodStatCardsProps {
  streak: number;
  avgMood7d: number;
  burnoutZone: string;
  monthlyCheckins: number;
  daysInMonth: number;
  todayDef: { emoji: string; label_en: string; label_ar: string } | null;
  isRTL: boolean;
}

const ACCENT_COLORS = {
  streak: TOOLKIT.lavender,
  avg: "", // dynamic
  checkins: TOOLKIT.sage,
  today: TOOLKIT.sky,
};

function MiniProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <svg width="44" height="44" className="mx-auto">
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted) / 0.3)" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
        className="transition-all duration-500"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-semibold">
        {value}
      </text>
    </svg>
  );
}

export function MoodStatCards({ streak, avgMood7d, burnoutZone, monthlyCheckins, daysInMonth, todayDef, isRTL }: MoodStatCardsProps) {
  const { t } = useTranslation();
  const zoneColor = ZONE_COLORS[burnoutZone] || TOOLKIT.sage;

  const stats = [
    {
      icon: <Flame className="h-5 w-5" strokeWidth={1.5} />,
      accent: ACCENT_COLORS.streak,
      content: (
        <>
          <span className="text-2xl font-bold text-foreground">{streak}</span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.currentStreak")}</span>
        </>
      ),
    },
    {
      icon: <TrendingUp className="h-5 w-5" strokeWidth={1.5} />,
      accent: zoneColor,
      content: (
        <>
          <span className="text-2xl font-bold text-foreground">{avgMood7d}</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: zoneColor + "18", color: zoneColor }}
          >
            {t(`mentalToolkit.moodDashboard.${burnoutZone}`)}
          </span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.avgMood7d")}</span>
        </>
      ),
    },
    {
      icon: <CalendarCheck className="h-5 w-5" strokeWidth={1.5} />,
      accent: ACCENT_COLORS.checkins,
      content: (
        <>
          <MiniProgressRing value={monthlyCheckins} max={daysInMonth} color={ACCENT_COLORS.checkins} />
          <span className="text-xs text-muted-foreground">
            {monthlyCheckins}/{daysInMonth} {t("mentalToolkit.moodDashboard.monthlyCheckins")}
          </span>
        </>
      ),
    },
    {
      icon: todayDef ? null : <Activity className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />,
      accent: ACCENT_COLORS.today,
      content: todayDef ? (
        <>
          <span className="text-4xl leading-none">{todayDef.emoji}</span>
          <span className="text-sm font-medium text-foreground">{isRTL ? todayDef.label_ar : todayDef.label_en}</span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.todayMood")}</span>
        </>
      ) : (
        <>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.notCheckedIn")}</span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.todayMood")}</span>
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Card
          key={i}
          className={cn("premium-card-vip rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200")}
        >
          <div className="absolute inset-y-0 start-0 w-[3px] rounded-full" style={{ backgroundColor: s.accent }} />
          <CardContent className="p-5 ps-6 flex flex-col items-center text-center gap-1.5 relative">
            {s.icon && <div style={{ color: s.accent }}>{s.icon}</div>}
            {s.content}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
