import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, subDays } from "date-fns";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { TOOLKIT } from "@/config/toolkit-colors";

interface MoodEntry {
  date: string;
  emoji: string;
  score: number;
  notes: string;
}

const EMOJIS = [
  { emoji: "😞", score: 1, label: "Struggling" },
  { emoji: "😟", score: 2, label: "Low" },
  { emoji: "😐", score: 3, label: "Okay" },
  { emoji: "🙂", score: 4, label: "Good" },
  { emoji: "😄", score: 5, label: "Great" },
];

const LS_KEY = "mt_mood_entries";

function loadEntries(): MoodEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEntries(entries: MoodEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export default function MoodTrackerTool() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<MoodEntry[]>(loadEntries);
  const [selectedScore, setSelectedScore] = useState(3);
  const [notes, setNotes] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");
  const alreadyLogged = entries.some((e) => e.date === today);

  const selectedEmoji = EMOJIS.find((e) => e.score === selectedScore) ?? EMOJIS[2];

  const handleLog = () => {
    const newEntry: MoodEntry = {
      date: today,
      emoji: selectedEmoji.emoji,
      score: selectedScore,
      notes,
    };
    const filtered = entries.filter((e) => e.date !== today);
    const updated = [newEntry, ...filtered];
    saveEntries(updated);
    setEntries(updated);
    setNotes("");
    toast.success(t("mentalToolkit.moodTracker.todayLogged"));
  };

  // Build last 7 days chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const entry = entries.find((e) => e.date === d);
    return {
      day: format(subDays(new Date(), 6 - i), "EEE"),
      score: entry?.score ?? 0,
      emoji: entry?.emoji ?? "",
    };
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-toolkit-lavender/15">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.moodTracker.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.moodTracker.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Emoji Picker */}
        <div className="flex justify-between items-center gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e.score}
              onClick={() => setSelectedScore(e.score)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all duration-200 ${
                selectedScore === e.score
                  ? "border-toolkit-lavender bg-toolkit-lavender/20 scale-105"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              <span className="text-2xl sm:text-3xl">{e.emoji}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">{e.label}</span>
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("mentalToolkit.moodTracker.score")}</span>
            <span className="text-lg font-bold text-toolkit-plum">{selectedEmoji.emoji} {selectedEmoji.label}</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[selectedScore]}
            onValueChange={([v]) => setSelectedScore(v)}
            className="w-full"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">{t("mentalToolkit.moodTracker.notes")}</label>
          <Textarea
            placeholder={t("mentalToolkit.moodTracker.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            rows={2}
            className="resize-none rounded-xl"
          />
          <div className="text-xs text-muted-foreground text-end">{notes.length}/200</div>
        </div>

        {/* Log Button */}
        <Button
          onClick={handleLog}
          className="w-full rounded-xl font-semibold bg-gradient-to-r from-toolkit-lavender to-toolkit-sage text-toolkit-plum hover:opacity-90"
        >
          {alreadyLogged ? "✓ Update Today's Mood" : t("mentalToolkit.moodTracker.logMood")}
        </Button>

        {/* Weekly Chart */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">{t("mentalToolkit.moodTracker.weeklyChart")}</h3>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("mentalToolkit.moodTracker.noData")}</p>
          ) : (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-md">
                          <span className="text-lg me-1">{payload[0].payload.emoji || "—"}</span>
                          <span className="text-foreground font-medium">{payload[0].value ? `Score: ${payload[0].value}` : "No entry"}</span>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.score > 0 ? TOOLKIT.lavender : "hsl(var(--muted))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
