

## Fix Runtime Error + Prayer Auto-Miss Countdown + Premium UI Polish

### 1. Fix Runtime Error (Critical)
The `DashboardIslamicCalendarWidget is not defined` error is a **stale Vite chunk** — the file was deleted and all source references removed, but the browser cached an old bundle. The `vite:preloadError` handler added earlier covers dynamic imports but not this case. A hard refresh resolves it. No code change needed for this specific error.

### 2. Auto-Miss Logic (Already Exists — Needs Refinement)
The `usePrayerCountdown` hook already counts down 60 minutes from prayer start time. The `PrayerCard` component has auto-miss via `useEffect`. However, the **dashboard widget** (`DashboardPrayerWidget`) does NOT trigger auto-miss — it only shows the countdown badge passively.

**Changes to `DashboardPrayerWidget.tsx`:**
- Add auto-miss logic: when `usePrayerCountdown` returns `isExpired: true` and no log exists for that prayer, automatically call `logPrayer.mutate({ status: 'missed' })`
- Use a ref to prevent duplicate auto-miss calls
- The countdown badge already shows remaining minutes — keep it

### 3. Premium Minimal UI Redesign of Active Prayer Section
Current issues: the active prayer area uses `bg-[hsl(var(--islamic-accent))]/[0.13]` which is fine, but the countdown badge uses `--prayer-home` (orange) which doesn't semantically fit a timer.

**Add a new CSS token** `--prayer-countdown` in `index.css` for the countdown timer badge, and register it in the design system.

**UI changes to `DashboardPrayerWidget.tsx`:**
- Replace countdown badge color from `--prayer-home` to new `--prayer-countdown` token
- Simplify the active prayer card: remove the rounded-xl inner container, use a subtle top border separator instead (more premium/minimal)
- Use softer, quieter styling for action buttons — ghost-like with semantic token borders
- Add a thin progress bar showing elapsed time (0–60 min) as a visual countdown under the active prayer

### 4. Design System Registration
- Add `--prayer-countdown` token to `index.css` (light + dark)
- Add the token to the Prayer section in `DesignSystemPage.tsx` so it's editable

### Files Modified
1. `src/index.css` — add `--prayer-countdown` token (light + dark)
2. `src/components/dashboard/DashboardPrayerWidget.tsx` — add auto-miss logic, use new countdown token, premium UI polish
3. `src/pages/dev/DesignSystemPage.tsx` — register `--prayer-countdown` in Prayer colors section

