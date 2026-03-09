

## Add Voting Booth Widget to Employee Dashboard

### What
Create a new `DashboardVotingWidget` component that appears on the Employee Home page **above the Daily Check-in** when there are active voting cycles (status = `voting`). It shows a summary of pending ballots and links to the full Voting Booth page.

### Implementation

**1. New component: `src/components/dashboard/DashboardVotingWidget.tsx`**
- Uses `useAwardCycles` to find cycles with `status === 'voting'`
- For each voting cycle, uses a lightweight query to get the count of pending ballots (nominations not yet voted on by current user)
- Renders a prominent card with:
  - Vote icon + cycle name
  - Count of pending vs total ballots (e.g., "3 of 8 ballots remaining")
  - Progress bar showing completion
  - "Vote Now" CTA linking to `/recognition/vote`
- Returns `null` if no voting cycles exist or all ballots are completed
- RTL-compliant (logical properties, flipped chevron)

**2. Edit `src/pages/EmployeeHome.tsx`**
- Import `DashboardVotingWidget`
- Place it **above** the `InlineDailyCheckin` / completed check-in indicator block (after `DashboardEndorsementRequests`, before the daily check-in section)

**3. Translation keys** (en.json + ar.json)
- `home.votingWidget.title` — "Voting is Open!"  /  "التصويت مفتوح!"
- `home.votingWidget.pending` — "{{count}} ballots remaining"  /  "{{count}} بطاقات متبقية"
- `home.votingWidget.allDone` — "All votes submitted"  /  "تم تقديم جميع الأصوات"
- `home.votingWidget.voteNow` — "Vote Now"  /  "صوّت الآن"

