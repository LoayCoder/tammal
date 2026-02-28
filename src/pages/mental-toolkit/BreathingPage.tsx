import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Wind, Activity, Timer, Flame, TrendingUp, ArrowRight, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BreathingGroundingTool from "@/components/mental-toolkit/tools/BreathingGroundingTool";
import { useBreathingSessions, type BreathingSession } from "@/hooks/wellness/useBreathingSessions";
import { useMoodDefinitions } from "@/hooks/wellness/useMoodDefinitions";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { format } from "date-fns";

type Technique = "box" | "sigh" | "grounding";
type SessionLength = 3 | 5 | 8;
type PageState = "setup" | "active" | "complete";

const PALETTE = { lavender: "#C9B8E8", sage: "#A8C5A0", plum: "#4A3F6B" };

const TECHNIQUE_INFO: Record<Technique, { emoji: string; descKey: string }> = {
  box: { emoji: "📦", descKey: "mentalToolkit.breathing.boxDesc" },
  sigh: { emoji: "😮‍💨", descKey: "mentalToolkit.breathing.sighDesc" },
  grounding: { emoji: "🌍", descKey: "mentalToolkit.breathing.groundingDesc" },
};

export default function BreathingPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const { employee } = useCurrentEmployee();
  const { moods: moodDefs } = useMoodDefinitions(employee?.tenant_id ?? null);
  const { sessions, stats, isPending: isLoading, startSession, completeSession } = useBreathingSessions();

  const [pageState, setPageState] = useState<PageState>("setup");
  const [technique, setTechnique] = useState<Technique>("box");
  const [sessionLength, setSessionLength] = useState<SessionLength>(5);
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [lastDuration, setLastDuration] = useState(0);
  const [lastRounds, setLastRounds] = useState(0);
  const sessionIdRef = useRef<string | null>(null);

  const activeMoods = (moodDefs || [])
    .filter(m => m.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const handleStartSession = async () => {
    try {
      const id = await startSession({ technique, mood_before: moodBefore, rounds_target: sessionLength });
      sessionIdRef.current = id;
      setPageState("active");
    } catch { setPageState("active"); }
  };

  const handleSessionComplete = async (roundsCompleted: number, durationSeconds: number) => {
    setLastDuration(durationSeconds);
    setLastRounds(roundsCompleted);
    setPageState("complete");
  };

  const handleSaveAndReset = async () => {
    if (sessionIdRef.current) {
      try {
        await completeSession({
          id: sessionIdRef.current,
          mood_after: moodAfter,
          rounds_completed: lastRounds,
          duration_seconds: lastDuration,
        });
      } catch {}
    }
    resetToSetup();
  };

  const resetToSetup = () => {
    setPageState("setup");
    setMoodBefore(null);
    setMoodAfter(null);
    sessionIdRef.current = null;
  };

  const moodChange = moodAfter != null && moodBefore != null ? moodAfter - moodBefore : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-card border-0 rounded-none border-b border-border/50 px-4 py-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
            <Wind className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("mentalToolkit.breathing.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.breathing.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Stats Bar */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill icon={<Activity className="h-4 w-4" />} color={PALETTE.lavender} value={stats.totalSessions} label={t("mentalToolkit.breathing.totalSessions")} />
            <StatPill icon={<Timer className="h-4 w-4" />} color={PALETTE.sage} value={stats.totalMinutes} label={t("mentalToolkit.breathing.totalMinutes")} />
            <StatPill icon={<Flame className="h-4 w-4" />} color={PALETTE.lavender} value={`${stats.currentStreak}d`} label={t("mentalToolkit.moodDashboard.currentStreak")} />
            <StatPill icon={<TrendingUp className="h-4 w-4" />} color={PALETTE.sage} value={stats.avgMoodImprovement > 0 ? `+${stats.avgMoodImprovement}` : `${stats.avgMoodImprovement}`} label={t("mentalToolkit.breathing.avgImprovement")} />
          </div>
        )}

        {/* ── SETUP STATE ── */}
        {pageState === "setup" && (
          <Card className="glass-card border-0 rounded-2xl">
            <CardContent className="p-5 space-y-5">
              {/* Technique Selector */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t("mentalToolkit.breathing.title")}</p>
                <div className="flex gap-2 flex-wrap">
                  {(["box", "sigh", "grounding"] as Technique[]).map(tech => (
                    <button
                      key={tech}
                      onClick={() => setTechnique(tech)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                        technique === tech ? "border-transparent shadow-sm" : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                      style={technique === tech ? { background: PALETTE.lavender, color: PALETTE.plum } : {}}
                    >
                      <span>{TECHNIQUE_INFO[tech].emoji}</span>
                      {tech === "box" ? t("mentalToolkit.breathing.boxBreathing")
                        : tech === "sigh" ? t("mentalToolkit.breathing.physiologicalSigh")
                        : t("mentalToolkit.breathing.grounding")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Length (only for box/sigh) */}
              {technique !== "grounding" && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">{t("mentalToolkit.breathing.sessionLength")}</p>
                  <div className="flex gap-2">
                    {([3, 5, 8] as SessionLength[]).map(len => {
                      const labelKey = len === 3 ? "beginner" : len === 5 ? "intermediate" : "advanced";
                      return (
                        <button
                          key={len}
                          onClick={() => setSessionLength(len)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                            sessionLength === len ? "border-transparent shadow-sm" : "border-border bg-background text-muted-foreground hover:bg-muted"
                          }`}
                          style={sessionLength === len ? { background: PALETTE.sage, color: "#2d4a2a" } : {}}
                        >
                          {t(`mentalToolkit.breathing.${labelKey}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mood Before */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t("mentalToolkit.breathing.moodBeforePrompt")}</p>
                <div className="flex gap-3 justify-center">
                  {activeMoods.map(mood => (
                    <button
                      key={mood.key}
                      onClick={() => setMoodBefore(mood.score)}
                      className={`text-3xl transition-all rounded-full p-1 ${moodBefore === mood.score ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "opacity-60 hover:opacity-100"}`}
                      title={isRTL ? mood.label_ar : mood.label_en}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center pt-2">
                <Button
                  onClick={handleStartSession}
                  className="rounded-xl px-10 py-3 text-base"
                  style={{ background: `linear-gradient(135deg, ${PALETTE.lavender}, ${PALETTE.sage})`, color: PALETTE.plum }}
                >
                  {t("mentalToolkit.breathing.start")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ACTIVE SESSION ── */}
        {pageState === "active" && (
          <Card className="glass-card border-0 rounded-2xl">
            <CardContent className="p-5">
              <BreathingGroundingTool
                technique={technique}
                totalRounds={technique === "grounding" ? 5 : sessionLength}
                onComplete={handleSessionComplete}
                onCancel={resetToSetup}
              />
            </CardContent>
          </Card>
        )}

        {/* ── COMPLETION STATE ── */}
        {pageState === "complete" && (
          <Card className="glass-card border-0 rounded-2xl">
            <CardContent className="p-6 text-center space-y-5 animate-in fade-in duration-500">
              <div className="text-5xl">🌿</div>
              <h2 className="text-xl font-bold text-foreground">{t("mentalToolkit.breathing.complete")}</h2>
              <p className="text-sm text-muted-foreground">
                {Math.round(lastDuration / 60)} {t("mentalToolkit.breathing.totalMinutes").toLowerCase()} · {lastRounds} {t("mentalToolkit.breathing.round", { current: lastRounds, total: technique === "grounding" ? 5 : sessionLength }).split(" ")[0].toLowerCase()}
              </p>

              {/* Mood After */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t("mentalToolkit.breathing.moodAfterPrompt")}</p>
                <div className="flex gap-3 justify-center">
                  {activeMoods.map(mood => (
                    <button
                      key={mood.key}
                      onClick={() => setMoodAfter(mood.score)}
                      className={`text-3xl transition-all rounded-full p-1 ${moodAfter === mood.score ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "opacity-60 hover:opacity-100"}`}
                      title={isRTL ? mood.label_ar : mood.label_en}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Encouragement */}
              {moodChange !== null && (
                <p className="text-sm font-medium" style={{ color: moodChange > 0 ? PALETTE.sage : moodChange === 0 ? PALETTE.lavender : PALETTE.plum }}>
                  {moodChange > 0
                    ? t("mentalToolkit.breathing.encouragementImproved")
                    : moodChange === 0
                    ? t("mentalToolkit.breathing.encouragementSame")
                    : t("mentalToolkit.breathing.encouragementDeclined")}
                </p>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <Button onClick={handleSaveAndReset} className="rounded-xl" style={{ background: PALETTE.sage, color: "#2d4a2a" }}>
                  <RotateCcw className="h-4 w-4 me-1" /> {t("mentalToolkit.breathing.practiceAgain")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SESSION HISTORY ── */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">{t("mentalToolkit.breathing.viewHistory")}</h3>
          {sessions.length === 0 ? (
            <Card className="glass-card border-0 rounded-2xl border-dashed">
              <CardContent className="py-10 text-center space-y-2">
                <Wind className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{t("mentalToolkit.breathing.noSessionsYet")}</p>
                <p className="text-xs text-muted-foreground">{t("mentalToolkit.breathing.noSessionsDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((s: BreathingSession) => (
                <Card key={s.id} className="glass-card border-0 rounded-xl">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{TECHNIQUE_INFO[s.technique as Technique]?.emoji || "🌬️"}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {s.technique === "box" ? t("mentalToolkit.breathing.boxBreathing")
                            : s.technique === "sigh" ? t("mentalToolkit.breathing.physiologicalSigh")
                            : t("mentalToolkit.breathing.grounding")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.created_at), "MMM d, HH:mm")} · {Math.round(s.duration_seconds / 60)}m
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.mood_before != null && s.mood_after != null && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                          backgroundColor: s.mood_after >= s.mood_before ? `${PALETTE.sage}33` : `${PALETTE.lavender}33`,
                          color: s.mood_after >= s.mood_before ? PALETTE.sage : PALETTE.plum,
                        }}>
                          {s.mood_after > s.mood_before ? "+" : ""}{s.mood_after - s.mood_before}
                        </span>
                      )}
                      {s.completed && <span className="text-xs" style={{ color: PALETTE.sage }}>✓</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: string | number; label: string }) {
  return (
    <Card className="glass-stat border-0 rounded-2xl">
      <CardContent className="pt-4 pb-3 px-3 flex flex-col items-center text-center gap-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-xl font-bold text-foreground">{value}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      </CardContent>
    </Card>
  );
}
