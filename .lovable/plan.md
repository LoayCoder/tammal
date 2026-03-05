

# Start & Record Sessions + Resume + Surah Filter

## What to Build

1. **"Start Reading" button** on the Qur'an Reader page (`/spiritual/quran`) that navigates to the text reader and auto-starts the timer
2. **Resume from last session** — detect the user's most recent session (surah_name) and offer a "Resume" button that opens that surah directly
3. **Pick any previous session** — show past sessions as clickable items so the user can tap one to resume reading that surah
4. **Ayahs read tracking** — add `ayahs_read` column to `spiritual_quran_sessions` table so each session records how many ayahs were read
5. **Surah filter** on the Recent Sessions list — a Select dropdown to filter sessions by surah name

## Database Change

Add `ayahs_read` column to `spiritual_quran_sessions`:

```sql
ALTER TABLE public.spiritual_quran_sessions
ADD COLUMN ayahs_read integer DEFAULT 0;
```

No RLS changes needed — existing policies cover the new column.

## Implementation

### Task 1: DB Migration — add `ayahs_read` column

Single migration adding nullable integer `ayahs_read` with default 0.

### Task 2: Update `useQuranSessions` hook

- Add `ayahs_read` to the `QuranSession` interface and `logSession` mutation input
- Add a new query `useLastQuranSession()` that fetches the single most recent session (no date filter, order by `created_at desc`, limit 1) for "Resume" functionality
- Add optional `surahFilter` param to `useQuranSessions` — when set, add `.eq('surah_name', surahFilter)` to the query

### Task 3: Update `ReadingSessionDialog` to include ayahs count

- Accept `totalAyahs` prop (from surah metadata)
- Show the ayahs count in the dialog description
- Pass `ayahs_read` to `logSession.mutate()`

### Task 4: Update `QuranTextReader` to pass ayahs count

- Pass `surahData.surah.numberOfAyahs` as `totalAyahs` to `ReadingSessionDialog`
- Include it in the session dialog state

### Task 5: Update `QuranReader` page (main dashboard)

- **"Start Reading" button** — already exists as "Read Qur'an", keep it
- **Resume section** — above Recent Sessions, show a card: "Resume: {lastSession.surah_name} — {lastSession.ayahs_read} ayahs • {date}". Clicking navigates to `/spiritual/quran/read?surah={surahNumber}` (map surah name to number from SURAHS array)
- **Surah filter** on Recent Sessions — add a Select dropdown with "All Surahs" + unique surahs from sessions. Filter the displayed list client-side
- **Clickable session rows** — each session row gets a "Resume" button/icon that navigates to the reader with that surah pre-selected
- Show `ayahs_read` in each session badge

### Task 6: i18n keys

Add to `en.json` and `ar.json`:
- `spiritual.quran.resumeSession` — "Resume Last Session"
- `spiritual.quran.resumeReading` — "Resume"  
- `spiritual.quran.ayahsRead` — "ayahs"
- `spiritual.quran.filterBySurah` — "Filter by Surah"
- `spiritual.quran.allSurahs` — "All Surahs"
- `spiritual.quran.startReading` — "Start Reading"

