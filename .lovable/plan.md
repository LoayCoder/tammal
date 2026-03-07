

# Recognition Monitor Dashboard

## Problem
There is no admin dashboard to monitor the nomination and voting processes in real-time. Admins cannot see which departments have participated, nomination counts per theme, voting progress, or identify departments that haven't engaged yet.

## What We Are Building
A new **Recognition Monitor** page (`/admin/recognition/monitor`) — similar in pattern to the existing Survey Monitor (`/admin/survey-monitor`) — that provides real-time visibility into nomination and voting activity for a selected award cycle.

## Page Layout

### Header
- Page title + cycle selector dropdown (filtered to cycles in `nominating`, `voting`, `calculating`, or `announced` status)

### KPI Stat Cards (top row)
- **Total Nominations** — count of all submitted nominations for the cycle
- **Unique Nominees** — distinct nominee count
- **Departments Participating** — departments with at least one nomination
- **Departments Missing** — departments with zero nominations
- **Total Votes Cast** — count of votes for the cycle
- **Voting Completion %** — votes cast / eligible ballots

### Tabs: Nominations | Voting

#### Nominations Tab
1. **Department Breakdown Table** — each department row shows: name, nomination count, unique nominees, nomination rate (nominations / dept headcount)
2. **Theme Distribution** — bar chart showing nomination count per award theme
3. **Nominator Role Split** — pie/donut: manager vs peer vs self nominations
4. **Recent Nominations List** — latest 10 nominations with nominee name, theme, status, date

#### Voting Tab
1. **Department Voting Progress** — each department: eligible voters, votes cast, completion %
2. **Theme Voting Progress** — per-theme: total ballots, completed, pending
3. **Voting Timeline** — line chart of votes cast per day

## Technical Plan

### 1. New hook: `src/hooks/recognition/useRecognitionMonitor.ts`
- Accepts `cycleId`
- Queries `nominations` table aggregated by department and theme
- Queries `votes` table aggregated by department and theme
- Joins with `employees` for department resolution and `departments` for names
- Returns: nomination stats, voting stats, department breakdowns, theme breakdowns

### 2. New page: `src/pages/admin/RecognitionMonitor.tsx`
- Cycle selector (reuses pattern from RecognitionResults)
- Stat cards row using system `StatCard` or inline cards
- Tabs for Nominations and Voting sections
- Department tables, theme charts (recharts bar/donut)

### 3. Route registration
- Add route in `App.tsx`: `/admin/recognition/monitor`
- Add sidebar link under SaaS Management / Recognition group

### 4. Translations
- Add keys under `recognition.monitor.*` in `en.json` and `ar.json`

### Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/hooks/recognition/useRecognitionMonitor.ts` |
| Create | `src/pages/admin/RecognitionMonitor.tsx` |
| Edit | `src/App.tsx` (add route) |
| Edit | Sidebar component (add nav link) |
| Edit | `src/locales/en.json` |
| Edit | `src/locales/ar.json` |

