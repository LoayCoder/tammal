import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Flame } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCheckedDate: string | null;
  completedToday: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  createdAt: string;
}

const LS_KEY = "mt_habits";
const TODAY = format(new Date(), "yyyy-MM-dd");
const YESTERDAY = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

function loadHabits(): Habit[] {
  try {
    const raw: Habit[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    // Recalculate streak on load
    return raw.map((h) => {
      if (h.lastCheckedDate === TODAY) return h;
      if (h.lastCheckedDate !== YESTERDAY) return { ...h, streak: 0, completedToday: false };
      return { ...h, completedToday: false };
    });
  } catch { return []; }
}

function saveHabits(habits: Habit[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(habits));
}

export default function HabitsPlanner() {
  const { t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>(loadHabits);
  const [newName, setNewName] = useState("");

  const update = (updated: Habit[]) => { setHabits(updated); saveHabits(updated); };

  const addHabit = () => {
    if (!newName.trim() || habits.length >= 5) return;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      streak: 0,
      lastCheckedDate: null,
      completedToday: false,
      reminderEnabled: false,
      reminderTime: "08:00",
      createdAt: TODAY,
    };
    update([...habits, habit]);
    setNewName("");
  };

  const toggleComplete = (id: string) => {
    update(habits.map((h) => {
      if (h.id !== id) return h;
      const completing = !h.completedToday;
      if (completing) {
        const newStreak = h.lastCheckedDate === YESTERDAY ? h.streak + 1 : 1;
        return { ...h, completedToday: true, lastCheckedDate: TODAY, streak: newStreak };
      } else {
        const newStreak = Math.max(0, h.streak - 1);
        return { ...h, completedToday: false, streak: newStreak };
      }
    }));
  };

  const toggleReminder = (id: string) => {
    update(habits.map((h) => h.id === id ? { ...h, reminderEnabled: !h.reminderEnabled } : h));
  };

  const updateTime = (id: string, time: string) => {
    update(habits.map((h) => h.id === id ? { ...h, reminderTime: time } : h));
  };

  const deleteHabit = (id: string) => {
    update(habits.filter((h) => h.id !== id));
    toast({ title: "Habit removed" });
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(168,197,160,0.2), rgba(250,216,160,0.1))" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.habits.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.habits.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Add Habit */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHabit()}
              placeholder={habits.length >= 5 ? t("mentalToolkit.habits.maxHabits") : t("mentalToolkit.habits.habitPlaceholder")}
              disabled={habits.length >= 5}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              onClick={addHabit}
              disabled={!newName.trim() || habits.length >= 5}
              size="icon"
              className="rounded-xl w-10 h-10 shrink-0"
              style={{ background: "#A8C5A0", color: "#2d4a2a" }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {habits.length >= 5 && (
            <p className="text-xs text-muted-foreground">{t("mentalToolkit.habits.maxHabits")}</p>
          )}
        </div>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <span className="text-4xl">🌱</span>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.habits.noHabits")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  habit.completedToday ? "border-[#A8C5A0] bg-[#A8C5A0]/10" : "border-border bg-background"
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={habit.completedToday}
                    onCheckedChange={() => toggleComplete(habit.id)}
                    className="h-5 w-5 rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${habit.completedToday ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {habit.name}
                    </p>
                    {habit.completedToday && <p className="text-xs" style={{ color: "#2d6b3f" }}>{t("mentalToolkit.habits.completedToday")}</p>}
                  </div>
                  {/* Streak */}
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ background: "rgba(168,197,160,0.3)" }}>
                      <Flame className="h-3 w-3" style={{ color: "#e67e22" }} />
                      <span className="text-xs font-bold" style={{ color: "#2d4a2a" }}>
                        {t("mentalToolkit.habits.streak", { n: habit.streak })}
                      </span>
                    </div>
                  )}
                  <button onClick={() => deleteHabit(habit.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Reminder Row */}
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <Switch
                    checked={habit.reminderEnabled}
                    onCheckedChange={() => toggleReminder(habit.id)}
                    className="scale-90"
                  />
                  <span className="text-xs text-muted-foreground">{t("mentalToolkit.habits.reminder")}</span>
                  {habit.reminderEnabled && (
                    <input
                      type="time"
                      value={habit.reminderTime}
                      onChange={(e) => updateTime(habit.id, e.target.value)}
                      className="text-xs border border-input rounded-lg px-2 py-1 bg-background text-foreground ms-auto"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
