import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react";

type Technique = "box" | "sigh" | "grounding";

interface Phase {
  labelKey: string;
  duration: number;
  scale: string;
}

const BOX_PHASES: Phase[] = [
  { labelKey: "inhale", duration: 4, scale: "scale-100" },
  { labelKey: "hold", duration: 4, scale: "scale-100" },
  { labelKey: "exhale", duration: 4, scale: "scale-50" },
  { labelKey: "hold", duration: 4, scale: "scale-50" },
];

const SIGH_PHASES: Phase[] = [
  { labelKey: "inhale", duration: 2, scale: "scale-90" },
  { labelKey: "inhaleAgain", duration: 1, scale: "scale-100" },
  { labelKey: "longExhale", duration: 6, scale: "scale-50" },
];

const GROUNDING_STEPS = [
  { sense: "see", n: 5 },
  { sense: "hear", n: 4 },
  { sense: "touch", n: 3 },
  { sense: "smell", n: 2 },
  { sense: "taste", n: 1 },
];

interface Props {
  technique?: Technique;
  totalRounds?: number;
  onComplete?: (roundsCompleted: number, durationSeconds: number) => void;
  onCancel?: () => void;
}

export default function BreathingGroundingTool({ technique = "box", totalRounds = 5, onComplete, onCancel }: Props) {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [groundingStep, setGroundingStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const phases = technique === "box" ? BOX_PHASES : SIGH_PHASES;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setPaused(false);
    setPhaseIdx(0);
    setRound(0);
    setTimeLeft(0);
    setComplete(false);
    setGroundingStep(0);
    elapsedRef.current = 0;
  }, [clearTimer]);

  const start = useCallback(() => {
    setRunning(true);
    setPaused(false);
    setComplete(false);
    setPhaseIdx(0);
    setRound(1);
    setTimeLeft(phases[0].duration);
    setGroundingStep(0);
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
  }, [phases]);

  const pause = useCallback(() => {
    clearTimer();
    setPaused(true);
    elapsedRef.current += (Date.now() - startTimeRef.current) / 1000;
  }, [clearTimer]);

  const resume = useCallback(() => {
    setPaused(false);
    startTimeRef.current = Date.now();
  }, []);

  // Timer effect for box/sigh
  useEffect(() => {
    if (!running || paused || technique === "grounding") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhaseIdx(pi => {
            const next = (pi + 1) % phases.length;
            if (next === 0) {
              setRound(r => {
                if (r >= totalRounds) {
                  clearTimer();
                  setRunning(false);
                  setComplete(true);
                  const dur = Math.round(elapsedRef.current + (Date.now() - startTimeRef.current) / 1000);
                  onComplete?.(r, dur);
                  return r;
                }
                return r + 1;
              });
            }
            return next;
          });
          return phases[0].duration; // reset for next phase
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimer();
  }, [running, paused, technique, phases, totalRounds, clearTimer, onComplete]);

  // Update timeLeft when phaseIdx changes
  useEffect(() => {
    if (running && !paused && technique !== "grounding") {
      setTimeLeft(phases[phaseIdx % phases.length].duration);
    }
  }, [phaseIdx]); // intentionally minimal deps

  const handleGroundingComplete = useCallback(() => {
    setRunning(false);
    setComplete(true);
    const dur = Math.round(elapsedRef.current + (Date.now() - startTimeRef.current) / 1000);
    onComplete?.(5, dur);
  }, [onComplete]);

  const currentPhase = phases[phaseIdx % phases.length];
  const circleScale = running && !paused ? currentPhase.scale : "scale-75";

  const phaseLabel = (key: string) => {
    const map: Record<string, string> = {
      inhale: t("mentalToolkit.breathing.inhale"),
      hold: t("mentalToolkit.breathing.hold"),
      exhale: t("mentalToolkit.breathing.exhale"),
      inhaleAgain: t("mentalToolkit.breathing.inhaleAgain"),
      longExhale: t("mentalToolkit.breathing.longExhale"),
    };
    return map[key] || key;
  };

  // Grounding technique
  if (technique === "grounding") {
    return (
      <div className="space-y-4">
        {!running && !complete && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.breathing.groundingIntro")}</p>
            <Button onClick={() => { setRunning(true); setGroundingStep(0); startTimeRef.current = Date.now(); }} className="rounded-xl px-8" style={{ background: "#A8C5A0", color: "#2d4a2a" }}>
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
            <p className="text-sm text-muted-foreground">
              {t("mentalToolkit.breathing.step", { current: groundingStep + 1, total: 5 })}
            </p>
            {/* Progress dots */}
            <div className="flex gap-2 justify-center">
              {GROUNDING_STEPS.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i <= groundingStep ? 'opacity-100' : 'opacity-30'}`} style={{ background: i <= groundingStep ? "#A8C5A0" : "hsl(var(--muted))" }} />
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              {groundingStep < 4 ? (
                <Button onClick={() => setGroundingStep(s => s + 1)} className="rounded-xl" style={{ background: "#A8C5A0", color: "#2d4a2a" }}>
                  {t("mentalToolkit.breathing.next")} <ArrowRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                </Button>
              ) : (
                <Button onClick={handleGroundingComplete} className="rounded-xl" style={{ background: "#C9B8E8", color: "#4A3F6B" }}>
                  {t("mentalToolkit.breathing.finish")} 🌿
                </Button>
              )}
              <Button variant="outline" onClick={() => { reset(); onCancel?.(); }} className="rounded-xl">
                <RotateCcw className="h-4 w-4 me-1" /> {t("mentalToolkit.breathing.startOver")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Box / Sigh technique
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Animated Circle */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div
          className={`absolute inset-0 rounded-full transition-all ${circleScale}`}
          style={{
            background: "linear-gradient(135deg, rgba(201,184,232,0.6), rgba(168,197,160,0.6))",
            transitionDuration: running && !paused ? `${currentPhase.duration * 1000}ms` : "500ms",
            transitionTimingFunction: "ease-in-out",
          }}
        />
        <div className="relative z-10 text-center">
          {!running && !complete ? (
            <span className="text-4xl">✨</span>
          ) : running ? (
            <>
              <p className="font-bold text-lg" style={{ color: "#4A3F6B" }}>
                {phaseLabel(currentPhase.labelKey)}
              </p>
              <p className="text-3xl font-bold" style={{ color: "#4A3F6B" }}>{timeLeft}</p>
            </>
          ) : null}
        </div>
      </div>

      {/* Round progress dots */}
      {running && !complete && (
        <div className="flex gap-1.5 justify-center">
          {Array.from({ length: totalRounds }, (_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < round ? 'opacity-100' : 'opacity-30'}`} style={{ background: i < round ? "#C9B8E8" : "hsl(var(--muted))" }} />
          ))}
        </div>
      )}

      {/* Status */}
      {running && !complete && (
        <p className="text-sm text-muted-foreground">
          {t("mentalToolkit.breathing.round", { current: round, total: totalRounds })}
          {paused && ` — ${t("mentalToolkit.breathing.pause")}`}
        </p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!running && !complete && (
          <Button onClick={start} className="rounded-xl px-8" style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)", color: "#4A3F6B" }}>
            <Play className="h-4 w-4 me-1" /> {t("mentalToolkit.breathing.start")}
          </Button>
        )}
        {running && !paused && (
          <Button variant="outline" onClick={pause} className="rounded-xl px-8">
            <Pause className="h-4 w-4 me-1" /> {t("mentalToolkit.breathing.pause")}
          </Button>
        )}
        {running && paused && (
          <Button onClick={resume} className="rounded-xl px-8" style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)", color: "#4A3F6B" }}>
            <Play className="h-4 w-4 me-1" /> {t("mentalToolkit.breathing.resume")}
          </Button>
        )}
        {running && (
          <Button variant="outline" onClick={() => { reset(); onCancel?.(); }} className="rounded-xl">
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
