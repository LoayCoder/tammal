import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/components/ui/accordion";
import { toast } from "sonner";
import { format } from "date-fns";
import { TOOLKIT_CATEGORY_COLORS } from "@/config/toolkit-colors";

interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  category: string;
  response: string;
}

const LS_KEY = "mt_journal_entries";

const PROMPTS = [
  { text: "What are three things you are genuinely grateful for today?", category: "gratitude" },
  { text: "Describe a small moment of joy you experienced recently.", category: "gratitude" },
  { text: "What is something beautiful you noticed today?", category: "gratitude" },
  { text: "Who in your life are you most thankful for, and why?", category: "gratitude" },
  { text: "What is one thing your body does for you that you appreciate?", category: "gratitude" },
  { text: "What is one thing you are proud of that you rarely acknowledge?", category: "gratitude" },
  { text: "List 5 things that went right today, no matter how small.", category: "gratitude" },
  { text: "What would you say to a close friend going through what you are facing?", category: "selfCompassion" },
  { text: "Describe a mistake you made and how you can offer yourself forgiveness.", category: "selfCompassion" },
  { text: "What does your inner critic say most often? How can you respond with kindness?", category: "selfCompassion" },
  { text: "In what ways are you being hard on yourself that you would not expect of others?", category: "selfCompassion" },
  { text: "Write a loving letter to your past self about a painful time.", category: "selfCompassion" },
  { text: "What is one thing you can do today to be kinder to yourself?", category: "selfCompassion" },
  { text: "What are your top three core values in life? Are you living by them?", category: "values" },
  { text: "What does 'a meaningful life' look like to you?", category: "values" },
  { text: "Describe a decision you made that felt deeply aligned with who you are.", category: "values" },
  { text: "What do you want to be remembered for?", category: "values" },
  { text: "What boundaries do you need to set to honour your values?", category: "values" },
  { text: "Where in your life do your actions not align with your values?", category: "values" },
  { text: "What does success mean to you — separate from what society says?", category: "values" },
  { text: "On a scale of 1–10, how are you feeling emotionally right now, and why?", category: "emotionalCheckin" },
  { text: "What emotion have you been avoiding lately? What might it be telling you?", category: "emotionalCheckin" },
  { text: "Describe a recent situation that triggered a strong emotion. What did it reveal?", category: "emotionalCheckin" },
  { text: "What does your body feel like right now? Scan from head to toe.", category: "emotionalCheckin" },
  { text: "What unmet need might be driving a frustration you are feeling?", category: "emotionalCheckin" },
  { text: "What emotion do you find hardest to express? Why?", category: "emotionalCheckin" },
  { text: "How have your emotions shifted over the past week?", category: "emotionalCheckin" },
  { text: "What are you holding onto that you need to let go of?", category: "emotionalCheckin" },
  { text: "What gives you the most energy, and what drains you?", category: "emotionalCheckin" },
  { text: "If your emotions today could speak, what would they say?", category: "emotionalCheckin" },
];

function getDayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function loadEntries(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

export default function JournalingPromptsTool() {
  const { t } = useTranslation();
  const [response, setResponse] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>(loadEntries);
  const today = format(new Date(), "yyyy-MM-dd");

  const promptIdx = getDayOfYear(new Date()) % PROMPTS.length;
  const todayPrompt = PROMPTS[promptIdx];
  const todayEntry = entries.find((e) => e.date === today);

  const handleSave = () => {
    if (!response.trim()) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: today,
      prompt: todayPrompt.text,
      category: todayPrompt.category,
      response,
    };
    const filtered = entries.filter((e) => e.date !== today);
    const updated = [entry, ...filtered];
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setEntries(updated);
    setResponse("");
    toast.success(t("mentalToolkit.journaling.saved"));
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-toolkit-sage/15">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📔</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.journaling.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.journaling.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Today's Prompt Card */}
        <div className="rounded-lg p-4 space-y-2 bg-toolkit-sage/15 border border-toolkit-sage">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("mentalToolkit.journaling.todaysPrompt")}</span>
            <Badge
              className="text-xs rounded-full border-0 text-foreground"
              style={{ background: TOOLKIT_CATEGORY_COLORS[todayPrompt.category] }}
            >
              {t(`mentalToolkit.journaling.categories.${todayPrompt.category}`)}
            </Badge>
          </div>
          <p className="text-base font-medium text-foreground">{todayPrompt.text}</p>
        </div>

        {/* Already responded today? */}
        {todayEntry ? (
          <div className="rounded-xl p-3 bg-muted/50 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Your entry for today:</p>
            <p className="text-sm text-foreground">{todayEntry.response}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("mentalToolkit.journaling.yourResponse")}</label>
            <Textarea
              placeholder={t("mentalToolkit.journaling.responsePlaceholder")}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              className="resize-none rounded-xl"
            />
            <Button
              onClick={handleSave}
              disabled={!response.trim()}
              className="w-full rounded-xl font-semibold bg-toolkit-sage text-toolkit-plum hover:opacity-90"
            >
              {t("mentalToolkit.journaling.saveEntry")}
            </Button>
          </div>
        )}

        {/* Past Entries */}
        <Accordion type="single" collapsible>
          <AccordionItem value="past">
            <AccordionTrigger className="text-sm font-medium text-muted-foreground py-2">
              {t("mentalToolkit.journaling.pastEntries")} ({entries.length})
            </AccordionTrigger>
            <AccordionContent>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t("mentalToolkit.journaling.noPastEntries")}</p>
              ) : (
                <div className="space-y-3 pt-2">
                  {entries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="rounded-xl p-3 bg-muted/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                        <Badge className="text-xs rounded-full border-0 text-foreground" style={{ background: TOOLKIT_CATEGORY_COLORS[entry.category] }}>
                          {t(`mentalToolkit.journaling.categories.${entry.category}`)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic">{entry.prompt}</p>
                      <p className="text-sm text-foreground">{entry.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
