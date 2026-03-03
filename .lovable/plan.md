

# Add Mental Health Tools Hub to Employee Dashboard

## What
Add a new "Mental Health Tools" section to the EmployeeHome dashboard, giving users quick access to four key toolkit pages directly from their home screen.

## Tools to Include
| Tool | Icon | Route |
|------|------|-------|
| Breathing & Grounding | `Wind` | `/mental-toolkit/breathing` |
| Daily Journaling Prompts | `BookOpen` | `/mental-toolkit/journaling` |
| Positive Habits Planner | `CheckSquare` | `/mental-toolkit/habits` |
| Self-Assessment Quizzes | `ClipboardCheck` | `/mental-toolkit/assessment` |

## Design
- A 2x2 grid of compact cards (matching existing glass-card style)
- Each card: icon in a colored circle + title + short description + chevron
- Placed **after** the Spiritual widgets and **before** the Personal Mood Dashboard
- Section header: "Mental Health Tools" / "أدوات الصحة النفسية"

## File Changes

### Edit: `src/pages/EmployeeHome.tsx`
1. Import `Wind`, `BookOpen`, `CheckSquare`, `ClipboardCheck` from lucide-react
2. Add a new section between `DashboardIslamicCalendarWidget` (line 134) and `PersonalMoodDashboard` (line 137):
   - Section heading using existing `t()` keys (will add fallbacks)
   - 2x2 grid of `Link`-wrapped `Card` components, each with an icon, title, description, and chevron — same pattern as the existing Support Hub cards

Single file edit only.

