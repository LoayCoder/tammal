import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ASSESSMENT_COLORS, TOOLKIT } from "@/config/toolkit-colors";
import GradientButton from "@/components/mental-toolkit/shared/GradientButton";

interface Quiz {
  id: string;
  nameKey: string;
  descKey: string;
  emojiKey: string;
  questions: string[];
  options: { label: string; value: number }[];
  getResult: (score: number) => { labelKey: string; message: string; color: string };
}

const FREQ_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

const STRESS_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly often", value: 3 },
  { label: "Very often", value: 4 },
];

const QUIZZES: Quiz[] = [
  {
    id: "gad7", nameKey: "gad7", descKey: "gad7", emojiKey: "gad7",
    questions: [
      "Feeling nervous, anxious, or on edge?",
      "Not being able to stop or control worrying?",
      "Worrying too much about different things?",
      "Trouble relaxing?",
      "Being so restless that it is hard to sit still?",
      "Becoming easily annoyed or irritable?",
      "Feeling afraid, as if something awful might happen?",
    ],
    options: FREQ_OPTIONS,
    getResult: (score) => {
      if (score <= 4) return { labelKey: "minimal", message: "Your anxiety levels appear minimal. Keep practising self-care and check in with yourself regularly.", color: ASSESSMENT_COLORS.minimal };
      if (score <= 9) return { labelKey: "mild", message: "You are experiencing mild anxiety. Breathing exercises and journaling may help. Consider speaking to a counsellor if symptoms persist.", color: ASSESSMENT_COLORS.mild };
      if (score <= 14) return { labelKey: "moderate", message: "You are experiencing moderate anxiety. We encourage you to reach out to a mental health professional for support.", color: ASSESSMENT_COLORS.moderate };
      return { labelKey: "severe", message: "Your score suggests severe anxiety. Please speak with a qualified mental health professional or your doctor as soon as possible.", color: ASSESSMENT_COLORS.severe };
    },
  },
  {
    id: "phq9", nameKey: "phq9", descKey: "phq9", emojiKey: "phq9",
    questions: [
      "Little interest or pleasure in doing things?",
      "Feeling down, depressed, or hopeless?",
      "Trouble falling or staying asleep, or sleeping too much?",
      "Feeling tired or having little energy?",
      "Poor appetite or overeating?",
      "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
      "Trouble concentrating on things, such as reading the newspaper or watching television?",
      "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
      "Thoughts that you would be better off dead or of hurting yourself in some way?",
    ],
    options: FREQ_OPTIONS,
    getResult: (score) => {
      if (score <= 4) return { labelKey: "minimal", message: "Your mood appears healthy. Continue with self-care routines and check in with yourself regularly.", color: ASSESSMENT_COLORS.minimal };
      if (score <= 9) return { labelKey: "mild", message: "You may be experiencing mild depression. Gentle activity, social connection, and journaling can help. Consider speaking to someone if this persists.", color: ASSESSMENT_COLORS.mild };
      if (score <= 14) return { labelKey: "moderate", message: "You are experiencing moderate depression. We recommend connecting with a mental health professional for personalised support.", color: ASSESSMENT_COLORS.moderate };
      if (score <= 19) return { labelKey: "moderatelySevere", message: "Your score indicates moderately severe depression. Please seek professional support — effective help is available.", color: ASSESSMENT_COLORS.moderatelySevere };
      return { labelKey: "severe", message: "Your score suggests severe depression. Please reach out to a mental health professional or crisis line today. You deserve support.", color: ASSESSMENT_COLORS.severe };
    },
  },
  {
    id: "pss", nameKey: "pss", descKey: "pss", emojiKey: "pss",
    questions: [
      "Been upset because of something that happened unexpectedly?",
      "Felt that you were unable to control the important things in your life?",
      "Felt nervous and stressed?",
      "Felt confident about your ability to handle your personal problems?",
      "Felt that things were going your way?",
      "Been able to control irritations in your life?",
      "Felt that you were on top of things?",
      "Been angered because of things that happened that were outside of your control?",
      "Felt difficulties were piling up so high that you could not overcome them?",
      "Been able to control the way you spend your time?",
    ],
    options: STRESS_OPTIONS,
    getResult: (score) => {
      if (score <= 13) return { labelKey: "low", message: "Your perceived stress is low. You seem to be managing well. Keep up your self-care practices!", color: ASSESSMENT_COLORS.low };
      if (score <= 26) return { labelKey: "moderate", message: "You are experiencing moderate stress. Focus on boundaries, rest, and relaxation techniques. Consider mindfulness or journaling.", color: ASSESSMENT_COLORS.moderate };
      return { labelKey: "high", message: "Your stress levels appear high. We encourage you to speak with a mental health professional and review your current commitments and support systems.", color: ASSESSMENT_COLORS.high };
    },
  },
];

interface QuizResult {
  id: string;
  quizName: string;
  score: number;
  label: string;
  date: string;
}

const LS_KEY = "mt_quiz_results";

export default function SelfAssessmentQuiz() {
  const { t } = useTranslation();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<{ labelKey: string; message: string; color: string; score: number } | null>(null);

  const handleStart = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedOption(null);
    setResult(null);
  };

  const handleNext = () => {
    if (selectedOption === null || !selectedQuiz) return;
    const newAnswers = [...answers, selectedOption];
    if (currentQ + 1 >= selectedQuiz.questions.length) {
      const score = newAnswers.reduce((a, b) => a + b, 0);
      const res = selectedQuiz.getResult(score);
      setResult({ ...res, score });
      setAnswers(newAnswers);
    } else {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
    }
  };

  const handleSave = () => {
    if (!result || !selectedQuiz) return;
    const entry: QuizResult = {
      id: crypto.randomUUID(),
      quizName: t(`mentalToolkit.quiz.quizzes.${selectedQuiz.id}.name`),
      score: result.score,
      label: result.labelKey,
      date: format(new Date(), "yyyy-MM-dd"),
    };
    const existing: QuizResult[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    localStorage.setItem(LS_KEY, JSON.stringify([entry, ...existing].slice(0, 20)));
    toast.success(t("mentalToolkit.quiz.resultSaved"));
  };

  const handleRetake = () => {
    if (!selectedQuiz) return;
    handleStart(selectedQuiz);
  };

  const handleBack = () => {
    setSelectedQuiz(null);
    setResult(null);
  };

  // Quiz selector
  if (!selectedQuiz) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-toolkit-sky/20 to-toolkit-sage/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="font-semibold text-foreground">{t("mentalToolkit.quiz.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("mentalToolkit.quiz.subtitle")}</p>
            </div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUIZZES.map((quiz) => (
            <button
              key={quiz.id}
              onClick={() => handleStart(quiz)}
              className="rounded-lg border border-border bg-background hover:bg-muted text-start p-4 transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2"
            >
              <div className="text-3xl">{t(`mentalToolkit.quiz.quizzes.${quiz.id}.emoji`)}</div>
              <p className="font-semibold text-foreground text-sm">{t(`mentalToolkit.quiz.quizzes.${quiz.id}.name`)}</p>
              <p className="text-xs text-muted-foreground">{t(`mentalToolkit.quiz.quizzes.${quiz.id}.desc`)}</p>
              <GradientButton solidColor={TOOLKIT.lavender} size="sm" className="w-full text-xs mt-2">
                {t("mentalToolkit.quiz.startQuiz")}
              </GradientButton>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{t(`mentalToolkit.quiz.quizzes.${selectedQuiz.id}.name`)} — Results</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Score */}
          <div className="text-center space-y-2">
            <div className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full shadow-lg" style={{ background: result.color + "30", border: `3px solid ${result.color}` }}>
              <span className="text-4xl font-bold text-foreground">{result.score}</span>
              <span className="text-xs text-muted-foreground">{t("mentalToolkit.quiz.yourScore")}</span>
            </div>
            <Badge className="text-sm rounded-full border-0 px-4 py-1 font-semibold text-foreground" style={{ background: result.color }}>
              {t(`mentalToolkit.quiz.labels.${result.labelKey}`)}
            </Badge>
          </div>

          {/* Message */}
          <div className="rounded-lg p-4 space-y-1" style={{ background: result.color + "20", border: `1px solid ${result.color}` }}>
            <p className="text-sm text-foreground leading-relaxed">{result.message}</p>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground leading-relaxed">⚠️ {t("mentalToolkit.quiz.disclaimer")}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl">← {t("common.back")}</Button>
            <Button variant="outline" onClick={handleRetake} className="flex-1 rounded-xl">{t("mentalToolkit.quiz.retake")}</Button>
            <GradientButton solidColor={ASSESSMENT_COLORS.minimal} onClick={handleSave} className="flex-1">{t("mentalToolkit.quiz.saveResult")}</GradientButton>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  const progress = (currentQ / selectedQuiz.questions.length) * 100;
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-foreground text-sm">{t(`mentalToolkit.quiz.quizzes.${selectedQuiz.id}.name`)}</h2>
          <span className="text-xs text-muted-foreground">
            {t("mentalToolkit.quiz.progress", { current: currentQ + 1, total: selectedQuiz.questions.length })}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <div className="p-5 space-y-5">
        {/* Question */}
        <p className="text-base font-medium text-foreground leading-relaxed">
          {currentQ + 1}. {selectedQuiz.questions[currentQ]}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {selectedQuiz.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedOption(opt.value)}
              className={`w-full text-start rounded-xl border p-3 text-sm transition-all ${
                selectedOption === opt.value
                  ? "border-transparent font-medium text-foreground"
                  : "border-border bg-background hover:bg-muted text-foreground"
              }`}
              style={selectedOption === opt.value ? { background: TOOLKIT.lavender, borderColor: TOOLKIT.lavender, color: TOOLKIT.plum } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="rounded-xl">← Back</Button>
          <GradientButton
            disabled={selectedOption === null}
            onClick={handleNext}
            className="flex-1 font-semibold"
          >
            {currentQ + 1 >= selectedQuiz.questions.length ? "See Results →" : t("mentalToolkit.quiz.next")} →
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
