
# Mental Toolbar — Full Feature Implementation Plan

## Overview

A new collapsible sidebar section "Mental Toolbar" will be added for all users (access: 'all'). It routes to a dedicated page `/mental-toolkit` that contains 3 sub-tabs: **Mental Tools**, **Mental Practices**, and **Mental Resources**. All data is stored in `localStorage` — no backend changes required.

---

## Architecture

```text
Sidebar Nav (AppSidebar.tsx)
  └── "Mental Toolkit" group (Brain icon, access: 'all')
        └── "Mental Toolkit" → /mental-toolkit

App.tsx
  └── Route: /mental-toolkit → <MentalToolkit />

src/pages/MentalToolkit.tsx
  ├── TAB 1: MentalToolsTab
  │     ├── MoodTrackerTool.tsx
  │     ├── ThoughtReframerTool.tsx
  │     └── BreathingGroundingTool.tsx
  ├── TAB 2: MentalPracticesTab
  │     ├── JournalingPromptsTool.tsx
  │     ├── MeditationLibraryTool.tsx
  │     └── HabitsPlanner.tsx
  └── TAB 3: MentalResourcesTab
        ├── PsychoeducationArticles.tsx
        ├── CrisisSupport.tsx
        └── SelfAssessmentQuiz.tsx
```

---

## Design System (Calm Mental Health Palette)

The feature uses its own design token layer applied via Tailwind custom classes:

| Token | Value | Usage |
|-------|-------|-------|
| Lavender | `#C9B8E8` | Primary accents, active tabs |
| Sage Green | `#A8C5A0` | Success states, habit streaks |
| Warm White | `#FAF8F5` | Card backgrounds |
| Deep Plum | `#4A3F6B` | Primary text |
| Soft Shadow | `shadow-[0_4px_20px_rgba(74,63,107,0.08)]` | All cards |
| Border Radius | `rounded-2xl` (16px) | All cards |

Font: `font-nunito` — added via Google Fonts import in `index.css`.

All Tailwind classes use logical properties (ms-, me-, ps-, pe-) per system rules.

---

## Files to Create / Modify

### 1. `src/index.css`
- Add Google Fonts import for Nunito
- Add CSS custom properties for the mental toolkit palette

### 2. `src/App.tsx`
- Add route: `<Route path="/mental-toolkit" element={<MentalToolkit />} />`
- Import `MentalToolkit` page

### 3. `src/components/layout/AppSidebar.tsx`
- Add new menu group "Mental Toolkit" with access: 'all'
- Single item: `{ title: t('nav.mentalToolkit'), url: "/mental-toolkit", icon: Brain }`

### 4. `src/locales/en.json` + `src/locales/ar.json`
- Add `nav.mentalToolkit` = "Mental Toolkit"
- Add `mentalToolkit.*` namespace for all tab labels and feature labels

### 5. `src/pages/MentalToolkit.tsx` (new page)
- Top-level page with a 3-tab `Tabs` component (shadcn)
- Tab triggers styled with lavender active state
- Smooth fade transitions between tabs via Tailwind `animate-in fade-in`

---

## TAB 1: Mental Tools

### `src/components/mental-toolkit/tools/MoodTrackerTool.tsx`
**State (localStorage key: `mt_mood_entries`):**
```ts
interface MoodEntry {
  date: string;       // yyyy-MM-dd
  emoji: string;      // 😞😟😐🙂😄
  score: number;      // 1–5
  notes: string;
}
```
**UI:**
- 5 large emoji buttons in a flex row, tap to select (ring highlight on selected)
- Slider (Radix `Slider`) mapped to 1-5 matching the emoji
- Textarea for notes/triggers (max 200 chars)
- "Log Mood" button → saves to `localStorage`, clears form
- Weekly chart below using `recharts` `BarChart` (last 7 days, y-axis 1-5, x-axis day names)
- Bar color uses the lavender palette

### `src/components/mental-toolkit/tools/ThoughtReframerTool.tsx`
**State (localStorage key: `mt_reframes`):**
```ts
interface ReframeEntry {
  id: string;
  date: string;
  negativeTHought: string;
  reframedThought: string;
}
```
**UI (3 steps with progress indicator):**
- Step 1: Large textarea "What's the negative thought weighing on you?"
- Step 2: 3 guided questions displayed sequentially:
  - "Is this thought 100% true?"
  - "What evidence supports this thought?"
  - "What evidence challenges it?"
  - Each gets its own small textarea response
- Step 3: Textarea "Now write your balanced, reframed thought"
- Summary card: shows Original Thought vs Reframed Thought side by side in a split card (lavender left, sage green right)
- "Save & Start Over" button saves to localStorage, "Past Reframes" accordion shows saved entries

### `src/components/mental-toolkit/tools/BreathingGroundingTool.tsx`
**Techniques:**
1. Box Breathing: 4s inhale → 4s hold → 4s exhale → 4s hold (16s cycle)
2. 5-4-3-2-1 Grounding: prompts for each sense (5 See, 4 Hear, 3 Touch, 2 Smell, 1 Taste)
3. Physiological Sigh: 2s inhale → 1s inhale again → 6s exhale

**Animated Circle:**
- CSS `scale` animation driven by `useEffect` + `useState(phase)`
- `transition-all duration-[4000ms]` class toggled between `scale-50` and `scale-100`
- Lavender gradient fill: `from-purple-100 to-purple-300`
- Center text changes: "Inhale", "Hold", "Exhale"

**Controls:**
- Technique selector (3 pill buttons)
- Start/Pause button
- Cycle counter ("Round 3 of 5")
- For 5-4-3-2-1: shows the text prompt per sense instead of circle

---

## TAB 2: Mental Practices

### `src/components/mental-toolkit/practices/JournalingPromptsTool.tsx`
**Prompts:** 30 hardcoded prompts across 4 categories (Gratitude, Self-Compassion, Values, Emotional Check-in)
**State (localStorage key: `mt_journal_entries`):**
```ts
interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  category: string;
  response: string;
}
```
**UI:**
- Today's prompt displayed in a lavender card at top (deterministic — `day of year % 30`)
- Category badge chip
- Textarea for response
- "Save Entry" button
- Past entries in a scrollable list grouped by date (accordion per date)

### `src/components/mental-toolkit/practices/MeditationLibraryTool.tsx`
**6 hardcoded meditations:**

| Title | Duration | Target |
|-------|----------|--------|
| Calm the Storm | 5 min | Anxiety |
| Sleep Wind-Down | 10 min | Sleep |
| Focus Reset | 3 min | Focus |
| Body Scan | 7 min | Stress |
| Self-Compassion | 5 min | Mood |
| Morning Clarity | 4 min | Energy |

**UI:**
- 2-column card grid (mobile: 1 column)
- Each card: emoji icon, title, duration badge, target badge
- Tap card → expanded player panel with:
  - Title + description
  - Fake progress bar (animates on play using `setInterval`)
  - Timer display (counts down from duration)
  - Play/Pause button (uses Web Audio API `OscillatorNode` to generate a soft ambient tone as placeholder audio)
  - Note: No actual audio file needed — oscillator produces a soft 432Hz sine wave

### `src/components/mental-toolkit/practices/HabitsPlanner.tsx`
**State (localStorage key: `mt_habits`):**
```ts
interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCheckedDate: string | null;
  completedToday: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:mm"
  createdAt: string;
}
```
**UI:**
- "Add Habit" form (max 5 habits enforced) — text input + Add button
- Each habit card:
  - Checkbox (marks done today — updates `streak` and `lastCheckedDate`)
  - Habit name
  - 🔥 streak count badge
  - Reminder toggle + time picker (`<input type="time">`)
  - Trash icon to delete
- Empty state with a gentle illustration description

---

## TAB 3: Mental Resources

### `src/components/mental-toolkit/resources/PsychoeducationArticles.tsx`
**6 hardcoded articles (full content inline):**

| Title | Category | Read Time |
|-------|----------|-----------|
| Understanding Anxiety | Anxiety | 4 min |
| What is Depression | Mood | 5 min |
| Stress & Sleep | Stress | 3 min |
| Cognitive Distortions | CBT | 6 min |
| Emotional Regulation | Skills | 4 min |
| Building Resilience | Growth | 5 min |

**UI:**
- Scrollable list of article preview cards (title, 2-line desc, read time chip, category badge)
- Tap card → full reading view (sheet or in-page expand with `animate-in slide-in-from-bottom`)
- Back button returns to list
- Uses a `useState<Article | null>(selectedArticle)` pattern

### `src/components/mental-toolkit/resources/CrisisSupport.tsx`
**7 hardcoded crisis contacts:**
| Name | Region | Phone | Availability |
|------|--------|-------|--------------|
| Emergency Services | Global | 911 / 999 / 112 | 24/7 |
| Crisis Text Line | US | Text HOME to 741741 | 24/7 |
| Samaritans | UK | 116 123 | 24/7 |
| Befrienders Worldwide | Global | befrienders.org | Varies |
| NAMI Helpline | US | 1-800-950-6264 | Mon-Fri |
| Tawasol | Middle East | 920033360 | 24/7 |
| Shefaa | Middle East | 00966-11-2052222 | 24/7 |

**UI:**
- Sticky red alert banner: "If you're in immediate danger, call emergency services"
- Region filter chips (Global, US, UK, Middle East)
- Each contact card: name, region tag, phone, availability badge
- Red "Call Now" button → `href="tel:..."` link
- Search input filters by name or region

### `src/components/mental-toolkit/resources/SelfAssessmentQuiz.tsx`
**3 quizzes:**
- **GAD-7** (Anxiety): 7 questions, score 0-21 → Minimal/Mild/Moderate/Severe
- **PHQ-9** (Depression/Mood): 9 questions, score 0-27 → Minimal/Mild/Moderate/Moderately Severe/Severe
- **PSS** (Stress): 10 questions, score 0-40 → Low/Moderate/High

**UI:**
- Quiz selector cards (3 tiles at top)
- One question at a time with:
  - Progress bar (shadcn `Progress` component)
  - Question text
  - 4-option radio group (Never/Sometimes/Often/Always style)
  - "Next" button
- Results screen:
  - Score number large
  - Range label badge (color coded: green/yellow/orange/red)
  - Personalized message (2-3 sentences)
  - Clinical disclaimer in a muted callout box
  - "Retake" and "Save Result" buttons
- **State (localStorage key: `mt_quiz_results`):**
```ts
interface QuizResult {
  id: string;
  quizName: string;
  score: number;
  label: string;
  date: string;
}
```

---

## File List Summary

**New Files (15):**
- `src/pages/MentalToolkit.tsx`
- `src/components/mental-toolkit/tools/MoodTrackerTool.tsx`
- `src/components/mental-toolkit/tools/ThoughtReframerTool.tsx`
- `src/components/mental-toolkit/tools/BreathingGroundingTool.tsx`
- `src/components/mental-toolkit/practices/JournalingPromptsTool.tsx`
- `src/components/mental-toolkit/practices/MeditationLibraryTool.tsx`
- `src/components/mental-toolkit/practices/HabitsPlanner.tsx`
- `src/components/mental-toolkit/resources/PsychoeducationArticles.tsx`
- `src/components/mental-toolkit/resources/CrisisSupport.tsx`
- `src/components/mental-toolkit/resources/SelfAssessmentQuiz.tsx`

**Modified Files (4):**
- `src/App.tsx` — add route
- `src/components/layout/AppSidebar.tsx` — add menu group
- `src/locales/en.json` — add keys
- `src/locales/ar.json` — add keys
- `src/index.css` — add Nunito font + CSS variables

---

## Key Technical Decisions

- **No backend required**: All state uses `localStorage` with typed helpers
- **No new dependencies**: Recharts (already installed), Radix Slider (already installed), Shadcn Tabs/Progress/Accordion (already in project)
- **Web Audio API** used for ambient meditation tones (browser built-in, no library needed)
- **RTL compliance**: All spacing uses `ms-/me-/ps-/pe-` logical properties
- **Streak logic**: On each app load, `HabitsPlanner` checks `lastCheckedDate`. If it's yesterday → keep streak. If it's today → already checked. If older → reset streak to 0.
- **Animation**: Tailwind `animate-in fade-in` for tab transitions, CSS custom transition for breathing circle
- **Sidebar group**: Access set to 'all' so both employees and admins see it — this is a personal wellness tool, not admin-gated

---

## No Database Changes Required
All user data for this feature is stored client-side in `localStorage`. No Lovable Cloud migrations, no RLS policies, no edge functions needed.
