import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Meditation {
  id: string;
  title: string;
  duration: number; // seconds
  targetKey: string;
  emoji: string;
  description: string;
}

const MEDITATIONS: Meditation[] = [
  { id: "1", title: "Calm the Storm", duration: 300, targetKey: "anxiety", emoji: "⛈️→🌤️", description: "A gentle breathing meditation to ease anxious thoughts and return to the present moment." },
  { id: "2", title: "Sleep Wind-Down", duration: 600, targetKey: "sleep", emoji: "🌙", description: "A slow, body-relaxing sequence to prepare your mind and body for restful sleep." },
  { id: "3", title: "Focus Reset", duration: 180, targetKey: "focus", emoji: "🎯", description: "A quick 3-minute clarity reset to sharpen attention and clear mental fog." },
  { id: "4", title: "Body Scan", duration: 420, targetKey: "stress", emoji: "🧘", description: "Travel through your body releasing tension, one area at a time." },
  { id: "5", title: "Self-Compassion", duration: 300, targetKey: "mood", emoji: "💛", description: "A loving-kindness practice to cultivate gentleness and warmth toward yourself." },
  { id: "6", title: "Morning Clarity", duration: 240, targetKey: "energy", emoji: "🌅", description: "An energising morning intention-setting session to start your day with purpose." },
];

const TARGET_COLORS: Record<string, string> = {
  anxiety: "#C9B8E8",
  sleep: "#A9CCE3",
  focus: "#FAD7A0",
  stress: "#F5CBA7",
  mood: "#F9E4B7",
  energy: "#A8C5A0",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function MeditationLibraryTool() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Meditation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const startAudio = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(432, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioRef.current = ctx;
      oscillatorRef.current = osc;
      gainRef.current = gain;
    } catch {}
  };

  const stopAudio = () => {
    try {
      if (gainRef.current && audioRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, audioRef.current.currentTime + 1);
        setTimeout(() => { oscillatorRef.current?.stop(); audioRef.current?.close(); }, 1100);
      }
    } catch {}
  };

  const handlePlay = () => {
    setPlaying(true);
    startAudio();
    intervalRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= (selected?.duration ?? 0)) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          stopAudio();
          return selected?.duration ?? 0;
        }
        return e + 1;
      });
    }, 1000);
  };

  const handlePause = () => {
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAudio();
  };

  const handleClose = () => {
    handlePause();
    setSelected(null);
    setElapsed(0);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); stopAudio(); }, []);

  const progress = selected ? (elapsed / selected.duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(169,204,227,0.2), rgba(201,184,232,0.1))" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧘</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.meditation.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.meditation.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Player */}
        {selected ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <button onClick={handleClose} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              ← Back to library
            </button>
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "linear-gradient(135deg, rgba(201,184,232,0.15), rgba(169,204,227,0.15))" }}>
              <div className="text-center space-y-1">
                <div className="text-4xl">{selected.emoji}</div>
                <h3 className="font-bold text-lg text-foreground">{selected.title}</h3>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                <Badge className="text-xs rounded-full border-0 text-foreground" style={{ background: TARGET_COLORS[selected.targetKey] + "80" }}>
                  {t(`mentalToolkit.meditation.targets.${selected.targetKey}`)}
                </Badge>
              </div>

              {/* Timer */}
              <div className="text-center">
                <span className="text-3xl font-mono font-bold text-foreground">
                  {formatTime(selected.duration - elapsed)}
                </span>
              </div>

              {/* Progress */}
              <Progress value={progress} className="h-2 rounded-full" />

              {/* Controls */}
              <div className="flex justify-center">
                {playing ? (
                  <Button onClick={handlePause} className="rounded-full w-14 h-14 text-xl" style={{ background: "#C9B8E8", color: "#4A3F6B" }}>⏸</Button>
                ) : (
                  <Button onClick={handlePlay} className="rounded-full w-14 h-14 text-xl" style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)", color: "#4A3F6B" }}>▶️</Button>
                )}
              </div>

              {elapsed >= selected.duration && (
                <p className="text-center font-semibold text-foreground">🌿 Session Complete!</p>
              )}
            </div>
          </div>
        ) : (
          /* Library Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEDITATIONS.map((med) => (
              <button
                key={med.id}
                onClick={() => { setSelected(med); setElapsed(0); setPlaying(false); }}
                className="rounded-2xl p-4 text-start border border-border bg-background hover:bg-muted transition-all space-y-2 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="text-2xl">{med.emoji}</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{med.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{med.description}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="text-xs rounded-full border-0 text-foreground px-2" style={{ background: TARGET_COLORS[med.targetKey] + "70" }}>
                    {t(`mentalToolkit.meditation.targets.${med.targetKey}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs rounded-full">
                    {t("mentalToolkit.meditation.minutes", { n: Math.floor(med.duration / 60) })}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
