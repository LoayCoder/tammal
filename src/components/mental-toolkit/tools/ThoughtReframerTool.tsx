import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReframeEntry {
  id: string;
  date: string;
  negativeThought: string;
  reframedThought: string;
}

const LS_KEY = "mt_reframes";

function loadEntries(): ReframeEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

export default function ThoughtReframerTool() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [negativeThought, setNegativeThought] = useState("");
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [reframedThought, setReframedThought] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [entries, setEntries] = useState<ReframeEntry[]>(loadEntries);

  const questions = [
    { key: "q1" as const, label: t("mentalToolkit.thoughtReframer.q1") },
    { key: "q2" as const, label: t("mentalToolkit.thoughtReframer.q2") },
    { key: "q3" as const, label: t("mentalToolkit.thoughtReframer.q3") },
  ];

  const handleSave = () => {
    const entry: ReframeEntry = {
      id: crypto.randomUUID(),
      date: format(new Date(), "yyyy-MM-dd"),
      negativeThought,
      reframedThought,
    };
    const updated = [entry, ...entries];
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setEntries(updated);
    setStep(1);
    setNegativeThought("");
    setAnswers({ q1: "", q2: "", q3: "" });
    setReframedThought("");
    setShowSummary(false);
    toast.success(t("mentalToolkit.thoughtReframer.saveSuccess"));
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-toolkit-lavender/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔄</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.thoughtReframer.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.thoughtReframer.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Progress Bar */}
        {!showSummary && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {step} of 3</span>
              <span>{step === 1 ? t("mentalToolkit.thoughtReframer.step1Title") : step === 2 ? t("mentalToolkit.thoughtReframer.step2Title") : t("mentalToolkit.thoughtReframer.step3Title")}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-toolkit-lavender to-toolkit-sage"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && !showSummary && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t("mentalToolkit.thoughtReframer.step1Prompt")}</label>
            <Textarea
              placeholder={t("mentalToolkit.thoughtReframer.step1Placeholder")}
              value={negativeThought}
              onChange={(e) => setNegativeThought(e.target.value)}
              rows={4}
              className="resize-none rounded-xl"
            />
            <Button
              disabled={!negativeThought.trim()}
              onClick={() => setStep(2)}
              className="w-full rounded-xl bg-toolkit-lavender text-toolkit-plum hover:opacity-90"
            >
              Continue →
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && !showSummary && (
          <div className="space-y-4">
            {questions.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-sm font-medium text-foreground">{label}</label>
                <Textarea
                  value={answers[key]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={2}
                  className="resize-none rounded-xl text-sm"
                  placeholder="Your thoughts..."
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">← Back</Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-toolkit-lavender text-toolkit-plum hover:opacity-90"
              >Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && !showSummary && (
          <div className="space-y-3">
            {/* Show original */}
            <div className="rounded-xl p-3 text-sm bg-toolkit-lavender/15 border-s-[3px] border-toolkit-lavender">
              <p className="text-xs text-muted-foreground mb-1">{t("mentalToolkit.thoughtReframer.originalLabel")}</p>
              <p className="text-foreground">{negativeThought}</p>
            </div>
            <label className="text-sm font-medium text-foreground">{t("mentalToolkit.thoughtReframer.step3Prompt")}</label>
            <Textarea
              placeholder={t("mentalToolkit.thoughtReframer.step3Placeholder")}
              value={reframedThought}
              onChange={(e) => setReframedThought(e.target.value)}
              rows={4}
              className="resize-none rounded-xl"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl">← Back</Button>
              <Button
                disabled={!reframedThought.trim()}
                onClick={() => setShowSummary(true)}
                className="flex-1 rounded-xl bg-gradient-to-r from-toolkit-lavender to-toolkit-sage text-toolkit-plum hover:opacity-90"
              >See Summary</Button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {showSummary && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="font-semibold text-center text-foreground">{t("mentalToolkit.thoughtReframer.summaryTitle")} ✨</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 space-y-2 bg-toolkit-lavender/20 border border-toolkit-lavender">
                <p className="text-xs font-semibold uppercase tracking-wide text-toolkit-plum">{t("mentalToolkit.thoughtReframer.originalLabel")}</p>
                <p className="text-sm text-foreground">{negativeThought}</p>
              </div>
              <div className="rounded-2xl p-4 space-y-2 bg-toolkit-sage/20 border border-toolkit-sage">
                <p className="text-xs font-semibold uppercase tracking-wide text-toolkit-sage">{t("mentalToolkit.thoughtReframer.reframedLabel")}</p>
                <p className="text-sm text-foreground">{reframedThought}</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="w-full rounded-xl font-semibold bg-gradient-to-r from-toolkit-sage to-toolkit-lavender text-toolkit-plum hover:opacity-90"
            >
              {t("mentalToolkit.thoughtReframer.saveStart")}
            </Button>
          </div>
        )}

        {/* Past Reframes */}
        {entries.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="past">
              <AccordionTrigger className="text-sm font-medium text-muted-foreground py-2">
                {t("mentalToolkit.thoughtReframer.pastReframes")} ({entries.length})
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {entries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="rounded-xl p-3 bg-muted/50 space-y-2">
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                      <p className="text-xs text-foreground line-clamp-2">{entry.negativeThought}</p>
                      <p className="text-xs font-medium text-toolkit-sage">→ {entry.reframedThought}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
