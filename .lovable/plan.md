

## Fix Missing Translation Keys

Two groups of missing i18n keys are causing raw key paths to display in the UI.

---

### 1. `home.*` — Mental Health Tools & Resources Hub (both en.json & ar.json)

The `MentalHealthToolsHub` and `MentalHealthResourcesHub` components reference keys under `home.*` that were never added to the locale files.

**Missing keys to add inside the `home` object:**

| Key | EN | AR |
|---|---|---|
| `mentalHealthTools` | Mental Health Tools | أدوات الصحة النفسية |
| `mentalHealthResources` | Mental Health Resources | موارد الصحة النفسية |
| `breathingGrounding` | Breathing & Grounding | تمارين التنفس والتأريض |
| `breathingGroundingDesc` | Guided breathing and grounding exercises | تمارين التنفس والتأريض الموجهة |
| `dailyJournaling` | Daily Journaling Prompts | مطالبات التدوين اليومي |
| `dailyJournalingDesc` | Reflect on your thoughts and feelings | تأمل أفكارك ومشاعرك |
| `habitsPlanner` | Positive Habits Planner | مخطط العادات الإيجابية |
| `habitsPlannerDesc` | Build and track healthy habits | بناء وتتبع العادات الصحية |
| `selfAssessment` | Self-Assessment Quizzes | اختبارات التقييم الذاتي |
| `selfAssessmentDesc` | Evaluate your mental wellbeing | قيّم صحتك النفسية |
| `meditationLibrary` | Meditation Library | مكتبة التأمل |
| `meditationLibraryDesc` | Guided meditation sessions | جلسات تأمل موجهة |
| `psychoeducationArticles` | Psychoeducation Articles | مقالات التثقيف النفسي |
| `psychoeducationArticlesDesc` | Learn about mental health topics | تعرف على مواضيع الصحة النفسية |
| `islamicCalendar` | Islamic Calendar | التقويم الإسلامي |
| `islamicCalendarDesc` | Important Islamic dates and events | التواريخ والمناسبات الإسلامية |

### 2. `workload.tasks.*` — Team Workload Table Headers (both en.json & ar.json)

The `TeamWorkload` page references `workload.tasks.title`, `.priority`, `.dueDate`, `.estimatedMinutes`, `.titleAr`, `.description`, plus filter keys `.statusTodo`, `.statusInProgress`, `.statusBlocked` — none exist.

**Add inside `workload.tasks`:**

| Key | EN | AR |
|---|---|---|
| `title` | Title | العنوان |
| `titleAr` | Title (Arabic) | العنوان (عربي) |
| `description` | Description | الوصف |
| `priority` | Priority | الأولوية |
| `dueDate` | Due Date | تاريخ الاستحقاق |
| `estimatedMinutes` | Est. Minutes | الدقائق المقدرة |
| `statusTodo` | To Do | قيد الانتظار |
| `statusInProgress` | In Progress | قيد التنفيذ |
| `statusBlocked` | Blocked | محظور |

### 3. `teamWorkload.*` — Status Badge Keys (both en.json & ar.json)

`StatusBadge` with `translationPrefix="teamWorkload"` generates keys like `teamWorkload.todo`, `teamWorkload.in_progress`, etc. These are missing.

**Add inside `teamWorkload`:**

| Key | EN | AR |
|---|---|---|
| `todo` | To Do | قيد الانتظار |
| `in_progress` | In Progress | قيد التنفيذ |
| `done` | Done | مكتمل |
| `blocked` | Blocked | محظور |
| `completed` | Completed | مكتمل |
| `not_started` | Not Started | لم يبدأ |

---

### Files Modified

| File | Change |
|---|---|
| `src/locales/en.json` | Add ~30 missing keys across `home`, `workload.tasks`, and `teamWorkload` |
| `src/locales/ar.json` | Add matching Arabic translations for the same keys |

