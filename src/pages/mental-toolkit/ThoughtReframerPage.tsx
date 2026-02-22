import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Brain, HelpCircle, Sparkles, Trash2, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useThoughtReframes } from "@/hooks/useThoughtReframes";
import { useCurrentEmployee } from "@/hooks/useCurrentEmployee";
import { format } from "date-fns";

const PALETTE = {
  lavender: "#C9B8E8",
  sage: "#A8C5A0",
  plum: "#4A3F6B",
};

const STEPS = ["stepIdentify", "stepChallenge", "stepReframe"] as const;

export default function ThoughtReframerPage() {
  const { t } = useTranslation();
  const { employee } = useCurrentEmployee();
  const { reframes, isLoading, stats, saveReframe, isSaving, deleteReframe, isDeleting } = useThoughtReframes();

  const [step, setStep] = useState(0);
  const [negativeThought, setNegativeThought] = useState("");
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [reframedThought, setReframedThought] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const handleSave = async () => {
    try {
      await saveReframe({
        negative_thought: negativeThought,
        challenge_answers: answers,
        reframed_thought: reframedThought,
      });
      toast({ title: t("mentalToolkit.thoughtReframer.saveSuccess") });
      setStep(0);
      setNegativeThought("");
      setAnswers({ q1: "", q2: "", q3: "" });
      setReframedThought("");
      setShowSummary(false);
    } catch {
      toast({ title: "Error saving reframe", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReframe(id);
      toast({ title: t("mentalToolkit.thoughtReframer.deleteSuccess") });
    } catch {
      toast({ title: "Error deleting", variant: "destructive" });
    }
  };

  const resetWizard = () => {
    setStep(0);
    setNegativeThought("");
    setAnswers({ q1: "", q2: "", q3: "" });
    setReframedThought("");
    setShowSummary(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-60" /></div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const noEmployee = !employee;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${PALETTE.lavender}, ${PALETTE.sage})` }}>
            <RefreshCw className="h-5 w-5 text-card" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("mentalToolkit.thoughtReframer.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.thoughtReframer.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Stats Bar */}
        {!noEmployee && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("mentalToolkit.thoughtReframer.statsTotal"), value: stats.total, icon: "📝" },
              { label: t("mentalToolkit.thoughtReframer.statsMonth"), value: stats.thisMonth, icon: "📅" },
              { label: t("mentalToolkit.thoughtReframer.statsStreak"), value: `${stats.streak}d`, icon: "🔥" },
            ].map((s) => (
              <Card key={s.label} className="rounded-2xl">
                <CardContent className="py-3 px-3 flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Wizard */}
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Step Indicator */}
            {!showSummary && (
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-center gap-0">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                          style={{
                            background: i <= step
                              ? `linear-gradient(135deg, ${PALETTE.lavender}, ${PALETTE.sage})`
                              : "hsl(var(--muted))",
                            color: i <= step ? "#fff" : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 text-center max-w-[64px]">
                          {t(`mentalToolkit.thoughtReframer.${s}`)}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className="w-12 h-0.5 mx-1 mt-[-12px] rounded transition-all duration-300"
                          style={{
                            backgroundColor: i < step ? PALETTE.lavender : "hsl(var(--border))",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 pb-5 space-y-4">
              {/* Step 1: Identify */}
              {step === 0 && !showSummary && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="rounded-xl p-4" style={{ background: `${PALETTE.lavender}15` }}>
                    <div className="flex items-start gap-2 mb-2">
                      <Brain className="h-5 w-5 mt-0.5 shrink-0" style={{ color: PALETTE.plum }} />
                      <label className="text-sm font-medium text-foreground">
                        {t("mentalToolkit.thoughtReframer.step1Prompt")}
                      </label>
                    </div>
                    <Textarea
                      placeholder={t("mentalToolkit.thoughtReframer.step1Placeholder")}
                      value={negativeThought}
                      onChange={(e) => setNegativeThought(e.target.value)}
                      rows={4}
                      className="resize-none rounded-xl border-border/50 bg-background/80"
                    />
                  </div>
                  <Button
                    disabled={!negativeThought.trim()}
                    onClick={() => setStep(1)}
                    className="w-full rounded-xl"
                    style={{ background: PALETTE.lavender, color: PALETTE.plum }}
                  >
                    {t("mentalToolkit.thoughtReframer.continueBtn")} →
                  </Button>
                </div>
              )}

              {/* Step 2: Challenge */}
              {step === 1 && !showSummary && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {(["q1", "q2", "q3"] as const).map((key, i) => (
                    <div key={key} className="rounded-xl p-3 border border-border/50" style={{ background: `${PALETTE.lavender}08` }}>
                      <div className="flex items-start gap-2 mb-2">
                        <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: PALETTE.lavender }} />
                        <label className="text-sm font-medium text-foreground">
                          {t(`mentalToolkit.thoughtReframer.${key}`)}
                        </label>
                      </div>
                      <Textarea
                        value={answers[key]}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                        rows={2}
                        className="resize-none rounded-xl text-sm border-border/50 bg-background/80"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-xl">
                      ← {t("mentalToolkit.thoughtReframer.backBtn")}
                    </Button>
                    <Button onClick={() => setStep(2)} className="flex-1 rounded-xl"
                      style={{ background: PALETTE.lavender, color: PALETTE.plum }}>
                      {t("mentalToolkit.thoughtReframer.continueBtn")} →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Reframe */}
              {step === 2 && !showSummary && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  {/* Original thought card */}
                  <div className="rounded-xl p-3 border-s-3" style={{
                    background: `${PALETTE.lavender}15`,
                    borderInlineStartColor: PALETTE.lavender,
                    borderInlineStartWidth: "3px",
                    borderInlineStartStyle: "solid",
                  }}>
                    <p className="text-xs text-muted-foreground mb-1">{t("mentalToolkit.thoughtReframer.originalLabel")}</p>
                    <p className="text-sm text-foreground italic">"{negativeThought}"</p>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: `${PALETTE.sage}12` }}>
                    <div className="flex items-start gap-2 mb-2">
                      <Sparkles className="h-5 w-5 mt-0.5 shrink-0" style={{ color: PALETTE.sage }} />
                      <label className="text-sm font-medium text-foreground">
                        {t("mentalToolkit.thoughtReframer.step3Prompt")}
                      </label>
                    </div>
                    <Textarea
                      placeholder={t("mentalToolkit.thoughtReframer.step3Placeholder")}
                      value={reframedThought}
                      onChange={(e) => setReframedThought(e.target.value)}
                      rows={4}
                      className="resize-none rounded-xl border-border/50 bg-background/80"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">
                      ← {t("mentalToolkit.thoughtReframer.backBtn")}
                    </Button>
                    <Button disabled={!reframedThought.trim()} onClick={() => setShowSummary(true)}
                      className="flex-1 rounded-xl"
                      style={{ background: `linear-gradient(135deg, ${PALETTE.lavender}, ${PALETTE.sage})`, color: PALETTE.plum }}>
                      {t("mentalToolkit.thoughtReframer.seeSummary")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Summary */}
              {showSummary && (
                <div className="space-y-4 animate-in fade-in duration-300 pt-3">
                  <h3 className="font-semibold text-center text-foreground">
                    {t("mentalToolkit.thoughtReframer.summaryTitle")} ✨
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl p-4 space-y-2" style={{ background: `${PALETTE.lavender}20`, border: `1px solid ${PALETTE.lavender}` }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: PALETTE.plum }}>
                        {t("mentalToolkit.thoughtReframer.originalLabel")}
                      </p>
                      <p className="text-sm text-foreground">{negativeThought}</p>
                    </div>
                    {/* Arrow */}
                    <div className="hidden sm:flex items-center justify-center absolute inset-0 pointer-events-none">
                      {/* We skip absolute positioning – keep simple */}
                    </div>
                    <div className="rounded-2xl p-4 space-y-2" style={{ background: `${PALETTE.sage}20`, border: `1px solid ${PALETTE.sage}` }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2d6b3f" }}>
                        {t("mentalToolkit.thoughtReframer.reframedLabel")}
                      </p>
                      <p className="text-sm text-foreground">{reframedThought}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetWizard} className="flex-1 rounded-xl">
                      {t("mentalToolkit.thoughtReframer.startOver")}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || noEmployee}
                      className="flex-1 rounded-xl font-semibold"
                      style={{ background: `linear-gradient(135deg, ${PALETTE.sage}, ${PALETTE.lavender})`, color: PALETTE.plum }}>
                      {isSaving ? "..." : t("mentalToolkit.thoughtReframer.saveStart")}
                    </Button>
                  </div>
                  {noEmployee && (
                    <p className="text-xs text-destructive text-center">
                      {t("mentalToolkit.thoughtReframer.loginRequired")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reframe Journal */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: PALETTE.lavender }} />
            {t("mentalToolkit.thoughtReframer.journalTitle")}
          </h2>

          {reframes.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-10 text-center space-y-2">
                <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{t("mentalToolkit.thoughtReframer.noReframesYet")}</p>
                <p className="text-xs text-muted-foreground">{t("mentalToolkit.thoughtReframer.noReframesDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {reframes.slice(0, visibleCount).map((entry) => {
                const isExpanded = expandedId === entry.id;
                const ca = entry.challenge_answers as Record<string, string> | null;
                return (
                  <Card key={entry.id} className="rounded-2xl transition-shadow hover:shadow-md">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            {format(new Date(entry.created_at), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">{entry.negative_thought}</p>
                          <p className="text-sm font-medium mt-1" style={{ color: "#2d6b3f" }}>
                            <span className="rtl:-scale-x-100 inline-block">→</span> {entry.reframed_thought}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("mentalToolkit.thoughtReframer.deleteConfirm")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("mentalToolkit.thoughtReframer.deleteDesc")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(entry.id)} disabled={isDeleting}>
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {isExpanded && ca && (
                        <div className="animate-in fade-in duration-200 space-y-2 pt-2 border-t border-border">
                          <p className="text-xs font-medium text-muted-foreground">{t("mentalToolkit.thoughtReframer.challengeAnswers")}</p>
                          {(["q1", "q2", "q3"] as const).map((key) =>
                            ca[key] ? (
                              <div key={key} className="rounded-lg p-2" style={{ background: `${PALETTE.lavender}08` }}>
                                <p className="text-xs font-medium text-muted-foreground">{t(`mentalToolkit.thoughtReframer.${key}`)}</p>
                                <p className="text-xs text-foreground mt-0.5">{ca[key]}</p>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {reframes.length > visibleCount && (
                <Button variant="outline" className="w-full rounded-xl"
                  onClick={() => setVisibleCount((c) => c + 10)}>
                  {t("mentalToolkit.thoughtReframer.viewMore")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
