

# Auto-Log Reading Sessions in Qur'an Reader

## What to Build

When a user reads a surah in the Mushaf reader (`/spiritual/quran/read`), automatically track reading time. When they stop (navigate back to surah list, leave the page, or switch surah), show a confirmation dialog asking if they want to save the session with the auto-recorded duration, surah name, and optional reflection notes.

## Implementation

### Task 1: Create `useReadingTimer` Hook

New hook `src/hooks/spiritual/useReadingTimer.ts`:
- Starts a timer (`setInterval` every second) when a surah is active
- Tracks `startTime`, `elapsedSeconds`, and current `surahName`/`juzNumber`
- Exposes `start(surahName, juzNumber)`, `stop() → { durationMinutes, surahName, juzNumber }`, `reset()`, `elapsedSeconds`
- Cleans up interval on unmount

### Task 2: Create `ReadingSessionDialog` Component

New component `src/components/spiritual/ReadingSessionDialog.tsx`:
- AlertDialog that appears when reading stops
- Shows auto-recorded duration (formatted as minutes), surah name
- Optional reflection notes textarea
- "Save Session" button calls `logSession` from `useQuranSessions`
- "Discard" button dismisses without saving
- RTL-safe with logical properties

### Task 3: Integrate into `QuranTextReader`

Modify `src/pages/spiritual/QuranTextReader.tsx`:
- Start timer when `activeSurah` is set and surah data loads (capturing surah englishName + juz from first verse)
- When user navigates back (`onBack`), switches surah, or unmounts: stop timer → if elapsed > 60 seconds, open the save dialog
- Show a small live reading timer badge in the header while reading (e.g., "⏱ 12:34")
- On surah switch via prev/next navigation: stop + prompt for previous surah, then start new timer

### Task 4: i18n Keys

Add to `en.json` and `ar.json`:
- `spiritual.quranReader.sessionDialog.title` — "Save Reading Session?"
- `spiritual.quranReader.sessionDialog.description` — "You read {surah} for {duration}. Would you like to log this session?"
- `spiritual.quranReader.sessionDialog.save` — "Save Session"
- `spiritual.quranReader.sessionDialog.discard` — "Discard"
- `spiritual.quranReader.sessionDialog.reflection` — "Add a reflection (optional)"
- `spiritual.quranReader.readingTime` — "Reading Time"
- `spiritual.quranReader.sessionSaved` — "Reading session saved"

No database changes needed — uses existing `useQuranSessions.logSession`.

