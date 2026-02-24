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

  const progressWidth = `${((step - 1) / 2) * 100}%`;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(201,184,232,0.15), rgba(250,248,245,0.8))" }}>
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
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%`, background: "linear-gradient(90deg, #C9B8E8, #A8C5A0)" }}
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
              className="w-full rounded-xl"
              style={{ background: "#C9B8E8", color: "#4A3F6B" }}
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
                className="flex-1 rounded-xl"
                style={{ background: "#C9B8E8", color: "#4A3F6B" }}
              >Continue →</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && !showSummary && (
          <div className="space-y-3">
            {/* Show original */}
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(201,184,232,0.15)", borderLeft: "3px solid #C9B8E8" }}>
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
                className="flex-1 rounded-xl"
                style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)", color: "#4A3F6B" }}
              >See Summary</Button>
            </div>
          </div>
        )}

        {/* Summary Card */}
        {showSummary && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="font-semibold text-center text-foreground">{t("mentalToolkit.thoughtReframer.summaryTitle")} ✨</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(201,184,232,0.2)", border: "1px solid #C9B8E8" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A3F6B" }}>{t("mentalToolkit.thoughtReframer.originalLabel")}</p>
                <p className="text-sm text-foreground">{negativeThought}</p>
              </div>
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "rgba(168,197,160,0.2)", border: "1px solid #A8C5A0" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2d6b3f" }}>{t("mentalToolkit.thoughtReframer.reframedLabel")}</p>
                <p className="text-sm text-foreground">{reframedThought}</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              className="w-full rounded-xl font-semibold"
              style={{ background: "linear-gradient(135deg, #A8C5A0, #C9B8E8)", color: "#4A3F6B" }}
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
                      <p className="text-xs font-medium" style={{ color: "#2d6b3f" }}>→ {entry.reframedThought}</p>
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
