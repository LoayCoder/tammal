

# Fix Qur'an Session Issues + Add Ayah Tracking & History Chart

## Problems Identified

1. **"Start Reading" button navigates to `/spiritual/quran/read` but doesn't auto-select a surah** — user lands on the surah list, timer doesn't start until they pick one. The "Resume" button works but "Start Reading" feels broken because nothing auto-starts.
2. **No ayah-level position tracking** — the system records `ayahs_read` as the total count of ayahs in the surah, not the actual ayah the user stopped at. There's no `last_ayah_position` to know where the user left off.
3. **Reading History has no Ayahs chart/trend** — the `QuranHistory` component only charts `totalMinutes` and `sessionCount` per day; `ayahs_read` is never aggregated or visualized.

## Plan

### Task 1: DB Migration — add `last_ayah_position` column

Add a column to track where the user stopped reading:

```sql
ALTER TABLE public.spiritual_quran_sessions
ADD COLUMN last_ayah_position integer DEFAULT 0;
```

This lets Resume navigate to the exact ayah.

### Task 2: Track scroll position as last ayah read in `SurahViewer`

- In `QuranTextReader.tsx` / `SurahViewer`, use an `IntersectionObserver` on each ayah `<span>` to detect which ayah is currently visible on screen.
- Store the highest visible ayah number in a ref (`currentAyahRef`).
- When the timer stops (back/navigate/switch), pass `currentAyahRef.current` as both `ayahs_read` (actual count read) and `last_ayah_position` to `ReadingSessionDialog`.

### Task 3: Update `ReadingSessionDialog` and `useQuranSessions`

- Add `last_ayah_position` to the `QuranSession` interface and `logSession` mutation.
- `ReadingSessionDialog` receives and saves `ayahs_read` (actual ayahs scrolled through) and `last_ayah_position`.

### Task 4: Resume from exact ayah position

- `useLastQuranSession` already returns `surah_name`. Now also use `last_ayah_position`.
- In `QuranReader.tsx`, pass `?surah=N&ayah=X` when resuming.
- In `QuranTextReader.tsx` / `SurahViewer`, read the `ayah` query param and scroll to that ayah on load using `scrollIntoView`.
- Update the Resume card to show "Ayah X" position.

### Task 5: Add Ayahs chart to `QuranHistory`

- In `useQuranHistory.ts`, compute `totalAyahs` per day from `sessions[].ayahs_read` and add it to `QuranDailyData`.
- Also compute aggregate `totalAyahsRead` across the range.
- In `QuranHistory.tsx`:
  - Add a new stat card: "Total Ayahs Read" with a BookOpen icon.
  - Add a third bar (`ayahsRead`) to the existing BarChart, or add a second small chart (line/area) specifically for ayahs trend.
  - Update the Legend and Tooltip to include the ayahs series.

### Task 6: Fix "Start Reading" UX

- When user clicks "Start Reading" with no last session, navigate to `/spiritual/quran/read` (surah list) — this is correct, user picks a surah.
- When there IS a last session, the "Start Reading" button should behave like "Resume" (auto-navigate to last surah + ayah). Keep the separate "Resume" card as well for visibility.

### Task 7: i18n keys

Add to `en.json` and `ar.json`:
- `spiritual.quran.history.totalAyahs` — "Total Ayahs"
- `spiritual.quran.history.dailyAyahs` — "Ayahs Read"
- `spiritual.quran.lastPosition` — "Ayah {{ayah}}"
- `spiritual.quran.resumeFrom` — "Resume from Ayah {{ayah}}"

