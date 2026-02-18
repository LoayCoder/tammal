import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

type Technique = "box" | "sigh" | "grounding";

interface Phase {
  label: string;
  duration: number; // seconds
  scale: string;
}

const BOX_PHASES: Phase[] = [
  { label: "Inhale", duration: 4, scale: "scale-100" },
  { label: "Hold", duration: 4, scale: "scale-100" },
  { label: "Exhale", duration: 4, scale: "scale-50" },
  { label: "Hold", duration: 4, scale: "scale-50" },
];

const SIGH_PHASES: Phase[] = [
  { label: "Inhale", duration: 2, scale: "scale-90" },
  { label: "Inhale again", duration: 1, scale: "scale-100" },
  { label: "Long Exhale", duration: 6, scale: "scale-50" },
];

const GROUNDING_STEPS = [
  { sense: "see", n: 5 },
  { sense: "hear", n: 4 },
  { sense: "touch", n: 3 },
  { sense: "smell", n: 2 },
  { sense: "taste", n: 1 },
];

export default function BreathingGroundingTool() {
  const { t } = useTranslation();
  const [technique, setTechnique] = useState<Technique>("box");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [groundingStep, setGroundingStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TOTAL_ROUNDS = 5;

  const phases = technique === "box" ? BOX_PHASES : SIGH_PHASES;
  const currentPhase = phases[phaseIdx % phases.length];

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
    setPhaseIdx(0);
    setRound(0);
    setTimeLeft(0);
    setComplete(false);
    setGroundingStep(0);
  }, []);

  const start = useCallback(() => {
    setRunning(true);
    setComplete(false);
    setPhaseIdx(0);
    setRound(1);
    setTimeLeft(phases[0].duration);
    setGroundingStep(0);
  }, [phases]);

  useEffect(() => {
    if (!running || technique === "grounding") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhaseIdx((pi) => {
            const next = (pi + 1) % phases.length;
            if (next === 0) {
              setRound((r) => {
                if (r >= TOTAL_ROUNDS) {
                  clearInterval(timerRef.current!);
                  setRunning(false);
                  setComplete(true);
                  return r;
                }
                return r + 1;
              });
            }
            setTimeLeft(phases[next].duration);
            return next;
          });
          return phases[(phaseIdx + 1) % phases.length].duration;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, phaseIdx, phases, technique]);

  const handleTechniqueChange = (t: Technique) => {
    stop();
    setTechnique(t);
  };

  const circleScale = running ? currentPhase.scale : "scale-75";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(168,197,160,0.2), rgba(201,184,232,0.1))" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌬️</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.breathing.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.breathing.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Technique Selector */}
        <div className="flex gap-2 flex-wrap">
          {(["box", "sigh", "grounding"] as Technique[]).map((tech) => (
            <button
              key={tech}
              onClick={() => handleTechniqueChange(tech)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                technique === tech
                  ? "border-transparent text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
              style={technique === tech ? { background: "#C9B8E8", color: "#4A3F6B" } : {}}
            >
              {tech === "box" ? t("mentalToolkit.breathing.boxBreathing")
                : tech === "sigh" ? t("mentalToolkit.breathing.physiologicalSigh")
                : t("mentalToolkit.breathing.grounding")}
            </button>
          ))}
        </div>

        {/* Grounding Technique */}
        {technique === "grounding" ? (
          <div className="space-y-4">
            {!running && !complete && (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Ground yourself by engaging all 5 senses. Take your time with each step.</p>
                <Button onClick={() => { setRunning(true); setGroundingStep(0); }} className="rounded-xl px-8" style={{ background: "#A8C5A0", color: "#2d4a2a" }}>
                  {t("mentalToolkit.breathing.start")}
                </Button>
              </div>
            )}
            {running && (
              <div className="text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg" style={{ background: "linear-gradient(135deg, rgba(168,197,160,0.4), rgba(201,184,232,0.4))" }}>
                  {["👁️", "👂", "✋", "👃", "👅"][groundingStep] || "✨"}
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {t(`mentalToolkit.breathing.groundingPrompts.${GROUNDING_STEPS[groundingStep]?.sense}`, { n: GROUNDING_STEPS[groundingStep]?.n })}
                </p>
                <p className="text-sm text-muted-foreground">Step {groundingStep + 1} of 5</p>
                <div className="flex gap-3 justify-center">
                  {groundingStep < 4 ? (
                    <Button onClick={() => setGroundingStep((s) => s + 1)} className="rounded-xl" style={{ background: "#A8C5A0", color: "#2d4a2a" }}>Next →</Button>
                  ) : (
                    <Button onClick={() => { setRunning(false); setComplete(true); }} className="rounded-xl" style={{ background: "#C9B8E8", color: "#4A3F6B" }}>Finish 🌿</Button>
                  )}
                  <Button variant="outline" onClick={stop} className="rounded-xl">Stop</Button>
                </div>
              </div>
            )}
            {complete && (
              <div className="text-center space-y-3 animate-in fade-in duration-300">
                <p className="text-2xl">🌿</p>
                <p className="font-semibold text-foreground">{t("mentalToolkit.breathing.complete")}</p>
                <Button variant="outline" onClick={stop} className="rounded-xl">Start Over</Button>
              </div>
            )}
          </div>
        ) : (
          /* Box / Sigh Technique */
          <div className="flex flex-col items-center space-y-6">
            {/* Animated Circle */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full transition-all ${circleScale}`}
                style={{
                  background: "linear-gradient(135deg, rgba(201,184,232,0.6), rgba(168,197,160,0.6))",
                  transitionDuration: running ? `${currentPhase.duration * 1000}ms` : "500ms",
                  transitionTimingFunction: "ease-in-out",
                }}
              />
              <div className="relative z-10 text-center">
                {complete ? (
                  <span className="text-3xl">🌿</span>
                ) : running ? (
                  <>
                    <p className="font-bold text-lg" style={{ color: "#4A3F6B" }}>
                      {currentPhase.label === "Inhale" ? t("mentalToolkit.breathing.inhale")
                        : currentPhase.label === "Exhale" || currentPhase.label === "Long Exhale" ? t("mentalToolkit.breathing.exhale")
                        : t("mentalToolkit.breathing.hold")}
                    </p>
                    <p className="text-3xl font-bold" style={{ color: "#4A3F6B" }}>{timeLeft}</p>
                  </>
                ) : (
                  <span className="text-4xl">✨</span>
                )}
              </div>
            </div>

            {/* Status */}
            {complete && <p className="font-semibold text-foreground">{t("mentalToolkit.breathing.complete")}</p>}
            {running && !complete && (
              <p className="text-sm text-muted-foreground">
                {t("mentalToolkit.breathing.round", { current: round, total: TOTAL_ROUNDS })}
              </p>
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {!running && !complete && (
                <Button onClick={start} className="rounded-xl px-8" style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)", color: "#4A3F6B" }}>
                  {t("mentalToolkit.breathing.start")}
                </Button>
              )}
              {running && (
                <Button variant="outline" onClick={stop} className="rounded-xl px-8">
                  {t("mentalToolkit.breathing.pause")}
                </Button>
              )}
              {complete && (
                <Button variant="outline" onClick={stop} className="rounded-xl">Start Over</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
