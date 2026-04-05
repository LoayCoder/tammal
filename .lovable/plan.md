

## Generate Team Pulse SRS Document (PDF)

### What
Create a professional Software Requirements Specification (SRS) PDF document for the **Team Pulse** feature, covering all three modes: Personal, Team, and Organization — with improvement recommendations based on the current implementation analysis.

### Document Structure
1. **Cover Page** — Title, project name (Tammal SaaS), version, date
2. **Introduction** — Purpose, scope, definitions, references
3. **Current System Overview** — Existing architecture, components, data flow, scoring model
4. **Functional Requirements** — Detailed requirements for each mode (Personal, Team, Organization) including current capabilities and proposed improvements
5. **Non-Functional Requirements** — Performance, security (RLS/tenant isolation), localization (RTL), scalability
6. **Data Model** — Tables involved (pulse_targets, mood_entries, appreciations, unified_tasks, engagement_action_log, copilot_insight_cache)
7. **Engagement Score Algorithm** — Current weighted formula and proposed enhancements per mode
8. **AI Integration** — Lovable AI gateway, prompt engineering, caching strategy
9. **UI/UX Components** — Component inventory (TeamPulseCard, PulseModeSwitcher, PulseNudgeCard, QuickAppreciationCard, etc.)
10. **Improvement Recommendations** — Specific enhancements for each mode
11. **Appendices** — API contracts, edge function specification

### Technical Approach
- Generate using Python `reportlab` (Platypus)
- Professional formatting with Tammal brand colors
- Output to `/mnt/documents/Team_Pulse_SRS.pdf`
- Visual QA via `pdftoppm` inspection

### Content Highlights (Improvements per Mode)
**Personal**: Historical score tracking, goal-setting, streak gamification, personalized benchmarks
**Team**: Comparative team analytics, member participation heatmap, manager action queue, team health trends
**Organization**: Cross-department benchmarking, executive summary dashboard, org-wide sentiment trends, predictive engagement alerts

