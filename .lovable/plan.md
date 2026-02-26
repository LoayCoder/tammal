

## "Zen Night" Employee Homepage Redesign

### Overview
Transform the Employee Home page into a calming "Deep Night" experience with the exact color palette, animations, and component specifications provided. This is a major visual overhaul that respects the existing data hooks and business logic while completely restyling the UI.

---

### What Changes

#### 1. New "Deep Night" Color Theme (CSS Variables)
Update the dark theme CSS variables in `src/index.css` to match the spec's palette:
- Primary Background: `#0F172A` (HSL ~222 47% 11%)
- Card Background: `#1E293B` (HSL ~217 33% 17%)
- Accent Positive (Emerald): `#10B981`
- Accent Focus (Violet): `#8B5CF6`
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`

These map well to existing dark mode variables with minor tweaks. A new `--zen-violet` CSS variable will be added for the violet accent.

#### 2. Smart Header (replaces Hero Banner)
- Compact horizontal bar with greeting (18pt bold) on the start side
- Single "Status Pill" on the end side showing streak + points in one capsule: "5 Days . 120 pts"
- Post-check-in: a mini mood emoji appears next to the greeting text
- Removes the large hero banner card in favor of a slim, elegant header

#### 3. Hero Check-in Card (Priority 1)
- Full-width card with 24px padding, 24px corner radius
- Embeds the existing `InlineDailyCheckin` component (with `MoodStep` emoji grid)
- On mood selection: CSS `scale(1.05)` spring transition on the selected emoji (150ms)
- Submit button styled with violet background (`#8B5CF6`)
- Post-submission: card collapses with a CSS `fade-out` + `scale-down` animation (no Lottie dependency -- pure CSS/Tailwind animation to keep it lightweight)
- Gamification badges (streak + points) shown in the card header

#### 4. Survey Card (Priority 2 -- Conditional)
- Only visible when `pendingQuestions.length > 0`
- Shows a progress bar (4px height, emerald fill on slate track) if survey has partial progress
- "Resume Survey" vs "Start Survey" label based on draft status
- Card slides out to the end on completion (CSS `translate-x` animation, 600ms)

#### 5. Insight Carousel (Priority 3)
- Replaces the static Mood History chart and Burnout Indicator with a 3-slide auto-rotating carousel (6-second interval, cross-fade 800ms)
- **Slide 1 -- Mood Trend**: Minimal bezier line chart (no axes), "Last 7 Days" label, using existing `moodData`
- **Slide 2 -- Streak**: Large centered streak count with motivational text
- **Slide 3 -- Burnout Gauge**: Semi-circle gauge using CSS `conic-gradient` or SVG `stroke-dasharray`
- Manual dot indicators at the bottom for navigation

#### 6. Animations & Transitions
- **Page load**: Staggered fade-in from top to bottom (each section delays 100ms, total ~400ms) using CSS `@keyframes` + Tailwind `animate-in`
- **Mood selection**: `scale(1.1)` with 150ms spring transition (already partially implemented in MoodStep)
- **Carousel**: CSS cross-fade using opacity transitions (800ms)

#### 7. Spacing & Layout (Mobile First)
- Side margins: 16px (`px-4`)
- Vertical gap between cards: 20px (`space-y-5`)
- Corner radius: 24px for all main cards (`rounded-3xl`)
- Bottom nav safe area: 80px padding-bottom (`pb-20`)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add `--zen-violet` variable, add staggered fade-in keyframes, update card radius defaults for homepage |
| `src/pages/EmployeeHome.tsx` | **Major rewrite** -- Smart Header, Hero Check-in, Conditional Survey Card, Insight Carousel, new spacing/radius, staggered animations |
| `src/components/checkin/InlineDailyCheckin.tsx` | Style updates: violet submit button, 24px radius card, collapse animation post-submit |
| `src/locales/en.json` | New keys: `home.resumeSurvey`, `home.startSurvey`, `home.moodTrendSlide`, `home.streakSlide`, `home.capacitySlide` |
| `src/locales/ar.json` | Arabic translations for the new keys |

### Files NOT Modified
- All data hooks (`useCurrentEmployee`, `useGamification`, `useMoodHistory`, `useScheduledQuestions`) remain unchanged
- `MoodStep.tsx` -- existing component reused as-is (already has scale animation on selection)
- No new npm dependencies required

---

### Technical Details

**Insight Carousel Implementation:**
A lightweight `useState` + `useEffect` with `setInterval(6000)` cycles through 3 slides. Each slide is absolutely positioned with `opacity` and `transition-opacity duration-[800ms]`. The active slide gets `opacity-1`, others `opacity-0 pointer-events-none`.

**Staggered Fade-in:**
```css
@keyframes zen-fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.zen-stagger-1 { animation: zen-fade-in 400ms ease-out 0ms both; }
.zen-stagger-2 { animation: zen-fade-in 400ms ease-out 100ms both; }
.zen-stagger-3 { animation: zen-fade-in 400ms ease-out 200ms both; }
.zen-stagger-4 { animation: zen-fade-in 400ms ease-out 300ms both; }
```

**Semi-circle Gauge (Burnout):**
SVG-based with `stroke-dasharray` and `stroke-dashoffset` calculated from the burnout percentage. No external library needed.

**RTL Compliance:**
All spacing uses logical properties (`ps-`, `pe-`, `ms-`, `me-`). Carousel slide direction and chevron icons flip automatically with `dir="rtl"`.

