

# Fix Qur'an Reader: Add Visible "Stop & Save" Button + Remove Min Duration

## Problem

When the user opens a surah in the reader, there is no visible UI to stop reading and save the session. The timer runs silently in the background, and sessions only auto-save when navigating back (and only if 60+ seconds have passed). The user sees no feedback, no controls, and ends up going back to the surah list with nothing recorded.

## Solution

### Task 1: Add a floating "Stop Reading" control bar inside `SurahViewer`

Add a sticky/fixed bottom bar inside the `SurahViewer` component that shows:
- The live timer (already exists as a badge but only at the top)
- A prominent **"Stop & Save Session"** button
- The current surah name for context

This bar will be always visible while reading. When clicked, it triggers `stopAndPrompt()` which opens the `ReadingSessionDialog`.

### Task 2: Remove the 60-second minimum session threshold

Change `MIN_SESSION_SECONDS` from `60` to `0` in `QuranTextReader.tsx` so that any reading session can be saved regardless of duration.

### Task 3: Always show timer from start (fix timer visibility)

Currently the timer badge in `SurahViewer` only shows when `elapsedSeconds > 0`. Change this to always show the timer when a surah is open (it starts at `00:00`). This gives immediate visual feedback that a session is being tracked.

### Task 4: Add i18n keys

Add keys for:
- `spiritual.quranReader.stopAndSave` — "Stop & Save Session"
- `spiritual.quranReader.reading` — "Reading..."

### Files to modify

- `src/pages/spiritual/QuranTextReader.tsx` — Add floating control bar in `SurahViewer`, remove min duration, expose stop callback
- `src/locales/en.json` — Add new keys
- `src/locales/ar.json` — Add new keys

