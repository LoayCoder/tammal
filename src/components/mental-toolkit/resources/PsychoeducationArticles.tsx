import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  readTime: number;
  categoryKey: string;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: "1", title: "Understanding Anxiety", readTime: 4, categoryKey: "anxiety",
    description: "Learn what anxiety really is, why it happens, and how to recognise its many forms in daily life.",
    content: `Anxiety is one of the most common human experiences. At its core, it is your body's natural alarm system — designed to protect you from danger. When you sense a threat, your brain activates the "fight-or-flight" response, flooding your body with adrenaline and cortisol to prepare for action.

**What does anxiety feel like?**
Anxiety can show up as racing thoughts, a pounding heart, tightness in the chest, shortness of breath, or a sense of dread. Some people experience it as constant worry ("what if" thinking), while others feel it as sudden panic attacks.

**Why does anxiety become a problem?**
Our brains are wired to detect danger — but in modern life, our alarm system can misfire. Deadlines, social situations, health worries, and uncertainty can all trigger the same physiological response as a genuine physical threat.

**Common types of anxiety:**
• Generalised Anxiety Disorder (GAD) — persistent, excessive worry about many things
• Social Anxiety — intense fear of judgment or embarrassment in social situations
• Panic Disorder — recurrent unexpected panic attacks
• Health Anxiety — excessive worry about having or developing illness

**What helps?**
Evidence-based approaches include Cognitive Behavioural Therapy (CBT), mindfulness practices, breathing exercises, regular physical activity, and in some cases, medication. The most important step is to recognise anxiety for what it is — not a sign of weakness, but a signal worth listening to.

If anxiety is significantly affecting your daily life, speaking with a mental health professional is a compassionate and effective step forward.`,
  },
  {
    id: "2", title: "What is Depression?", readTime: 5, categoryKey: "mood",
    description: "Understand the difference between sadness and clinical depression, and learn about available support.",
    content: `Depression is more than just feeling sad. It is a complex mood disorder that affects how you think, feel, and function — often for weeks or months at a time.

**Depression vs. sadness**
Sadness is a normal emotional response to loss, disappointment, or pain. Depression is different: it is persistent, often without a clear cause, and affects your ability to function. You might lose interest in things you used to enjoy, struggle to get out of bed, or feel a deep numbness rather than sadness.

**Common symptoms:**
• Persistent low mood or emptiness
• Loss of interest or pleasure (anhedonia)
• Fatigue and lack of energy
• Difficulty concentrating
• Changes in sleep and appetite
• Feelings of worthlessness or guilt
• In severe cases, thoughts of self-harm or suicide

**Why does it happen?**
Depression results from a combination of biological (brain chemistry, genetics), psychological (thought patterns, trauma), and social (isolation, loss, stress) factors. It is not a character flaw or weakness.

**What helps?**
Therapy (especially CBT and Interpersonal Therapy), medication (antidepressants), lifestyle changes (exercise, sleep hygiene, social connection), and structured daily routines are all supported by research.

**Please know:** Depression is highly treatable. Most people with depression improve significantly with appropriate support. You do not have to face it alone.`,
  },
  {
    id: "3", title: "Stress & Sleep", readTime: 3, categoryKey: "stress",
    description: "Explore the powerful two-way relationship between chronic stress and poor sleep quality.",
    content: `Stress and sleep share a deeply connected relationship. Stress makes it harder to sleep; poor sleep makes you more vulnerable to stress. Understanding this cycle is the first step to breaking it.

**How stress disrupts sleep**
When you are stressed, your brain remains in a state of high alert — making it hard to fall asleep or stay asleep. Cortisol, the primary stress hormone, naturally drops in the evening to allow sleep. Chronic stress keeps cortisol elevated, preventing this drop.

**How poor sleep amplifies stress**
Sleep deprivation impairs the prefrontal cortex — the part of your brain responsible for rational thinking and emotional regulation. This makes you more reactive, less resilient, and more prone to catastrophic thinking.

**Signs your sleep is stress-related:**
• Lying awake with racing thoughts
• Waking in the early hours unable to return to sleep
• Feeling unrested despite hours of sleep
• Increased irritability and emotional sensitivity

**Evidence-based strategies:**
• **Sleep hygiene**: consistent sleep/wake times, cool dark room, no screens 30 min before bed
• **Progressive muscle relaxation**: systematically tensing and releasing muscle groups
• **Cognitive restructuring**: challenging catastrophic nighttime thoughts
• **Breathing exercises**: activating the parasympathetic nervous system (4-7-8 breathing)
• **Journaling**: "brain dumping" worries before bed to reduce mental load

Even small improvements in sleep quality can significantly reduce stress reactivity the following day.`,
  },
  {
    id: "4", title: "Cognitive Distortions", readTime: 6, categoryKey: "cbt",
    description: "Identify the common thinking traps that fuel anxiety and depression — and how to challenge them.",
    content: `Cognitive distortions are biased patterns of thinking that feel completely real and logical in the moment, but distort reality in ways that harm our mental health. Identifying them is a foundational skill in Cognitive Behavioural Therapy (CBT).

**Common cognitive distortions:**

**1. All-or-nothing thinking (Black-and-white)**
Seeing things in absolutes with no middle ground. "If I am not perfect, I am a complete failure."

**2. Catastrophising**
Assuming the worst possible outcome. "I made one mistake — my career is over."

**3. Mind reading**
Assuming you know what others are thinking, usually negatively. "She did not reply — she must hate me."

**4. Emotional reasoning**
Treating feelings as facts. "I feel stupid, so I must be stupid."

**5. Overgeneralisation**
Drawing sweeping conclusions from a single event. "This always happens to me."

**6. Personalisation**
Taking excessive blame for events outside your control. "They seem upset — it must be my fault."

**7. Filtering**
Focusing exclusively on negatives and filtering out positives. Receiving 9 compliments and 1 criticism — and only remembering the criticism.

**8. Should statements**
Rigid rules about how you or others "should" behave. "I should be stronger than this."

**How to challenge them:**
1. Notice the thought ("Is this a thinking trap?")
2. Examine the evidence for and against
3. Consider a more balanced perspective
4. Ask: "What would I say to a friend thinking this?"

With practice, challenging cognitive distortions becomes more automatic and powerful.`,
  },
  {
    id: "5", title: "Emotional Regulation", readTime: 4, categoryKey: "skills",
    description: "Practical skills to manage intense emotions without suppressing or being overwhelmed by them.",
    content: `Emotional regulation is the ability to influence which emotions you have, when you have them, and how you experience and express them. It is not about suppressing emotions — it is about having a healthy relationship with them.

**Why it matters**
Unregulated emotions can lead to impulsive decisions, relationship conflict, and increased mental health difficulties. Learning to regulate emotions is one of the most powerful skills for overall wellbeing.

**Key regulation strategies:**

**1. Name it to tame it**
Simply labelling an emotion ("I am feeling anxious") engages the prefrontal cortex and reduces the intensity of the emotional response. Research shows that affect labelling literally calms the amygdala.

**2. Physiological regulation**
Your body and mind are deeply connected. Slow diaphragmatic breathing, cold water on your face, or physical exercise can rapidly shift your emotional state by changing your physiology.

**3. Opposite action (from DBT)**
When an emotion urges a behaviour that is unhelpful (e.g., withdrawing when depressed), do the opposite (e.g., reach out to someone). This directly changes the emotion.

**4. Radical acceptance**
Accepting reality as it is — without approval or resignation — reduces the secondary suffering caused by fighting against what cannot be changed.

**5. TIPP skills (DBT)**
• Temperature (cold water on face for intense distress)
• Intense exercise
• Paced breathing
• Progressive muscle relaxation

**Building emotional awareness**
Keep a simple emotion log: situation → emotion → intensity (0-10) → body sensation → response. Over time, patterns emerge that reveal your unique emotional landscape.`,
  },
  {
    id: "6", title: "Building Resilience", readTime: 5, categoryKey: "growth",
    description: "Discover what resilience really means and how to cultivate it through practical, evidence-based habits.",
    content: `Resilience is often described as "bouncing back" from adversity. But a more accurate — and more useful — definition is the capacity to adapt well in the face of adversity, trauma, tragedy, threats, or significant sources of stress.

**Resilience is not a fixed trait**
You are not simply "resilient" or "not resilient." Resilience is a dynamic process that can be cultivated through specific behaviours, thoughts, and social connections.

**The four pillars of resilience:**

**1. Connection**
Strong, supportive relationships are the single most consistent predictor of resilience. Reaching out is a strength, not a weakness. Prioritise relationships with people who listen without judgment.

**2. Meaning-making**
People who can find some meaning or purpose — even in difficult experiences — tend to recover more effectively. This does not mean looking for a silver lining in everything, but rather finding your "why."

**3. Adaptive thinking**
Resilient people challenge unhelpful narratives ("I cannot cope") and replace them with more accurate ones ("This is hard, but I have handled hard things before"). This is not toxic positivity — it is realistic optimism.

**4. Self-care as a foundation**
Sleep, movement, nutrition, and rest are not luxuries — they are the biological infrastructure of resilience. When these are compromised, emotional and cognitive resources deplete rapidly.

**Practices that build resilience:**
• Regular reflection journaling
• Mindfulness meditation (even 5 min/day)
• Deliberately seeking new challenges in low-stakes situations
• Practising gratitude (shifts attention toward what is working)
• Post-traumatic growth: actively searching for what a difficult experience taught you

Resilience does not mean you will not feel pain or struggle. It means you develop a growing confidence in your ability to cope — and that confidence, over time, becomes self-fulfilling.`,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  anxiety: "#C9B8E8",
  mood: "#A9CCE3",
  stress: "#F5CBA7",
  cbt: "#FAD7A0",
  skills: "#A8C5A0",
  growth: "#F9E4B7",
};

export default function PsychoeducationArticles() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Article | null>(null);

  if (selected) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <Badge className="text-xs rounded-full border-0 text-foreground mb-1" style={{ background: CATEGORY_COLORS[selected.categoryKey] + "80" }}>
              {t(`mentalToolkit.articles.categories.${selected.categoryKey}`)}
            </Badge>
            <h2 className="font-bold text-foreground">{selected.title}</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{t("mentalToolkit.articles.readTime", { n: selected.readTime })}</span>
          </div>
        </div>
        <div className="p-5">
          <div className="prose prose-sm max-w-none text-foreground space-y-3">
            {selected.content.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground whitespace-pre-line">{para}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border" style={{ background: "linear-gradient(135deg, rgba(249,228,183,0.3), rgba(201,184,232,0.1))" }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <div>
            <h2 className="font-semibold text-foreground">{t("mentalToolkit.articles.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.articles.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {ARTICLES.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelected(article)}
            className="w-full rounded-2xl border border-border bg-background hover:bg-muted text-start p-4 transition-all hover:shadow-md hover:-translate-y-0.5 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground text-sm">{article.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                <span>{t("mentalToolkit.articles.readTime", { n: article.readTime })}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>
            <Badge className="text-xs rounded-full border-0 text-foreground" style={{ background: CATEGORY_COLORS[article.categoryKey] + "70" }}>
              {t(`mentalToolkit.articles.categories.${article.categoryKey}`)}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
