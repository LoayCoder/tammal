

# Improve Islamic Calendar: Deduplicate Events, Add Descriptions, Expand Coverage

## Problem
1. **Duplication**: The Aladhan API returns holidays (e.g., "Lailat-ul-Qadr") AND our local `ISLAMIC_EVENTS` map has the same event with a different name ("Laylat al-Qadr (est.)"). Both appear in the events list.
2. **No descriptions**: Events are just names with no context -- users don't know why a day matters.
3. **Limited coverage**: Missing several important Islamic dates (e.g., 6 days of Shawwal, Battle of Badr, Conquest of Makkah, etc.).

## Changes

### 1. Expand ISLAMIC_EVENTS with descriptions and more dates
**File:** `src/hooks/spiritual/useHijriCalendar.ts`

Add a `descEn` and `descAr` field to each event for a short one-line explanation. Also add these missing events:

| Hijri Date | Event |
|---|---|
| 1-1 | Islamic New Year -- "Marks the beginning of the Hijri calendar year" |
| 1-9 | Tasu'a -- "Day before Ashura, recommended to fast" |
| 1-10 | Ashura -- "Commemorates Prophet Musa's deliverance; recommended fasting" |
| 2-1 | First of Safar -- informational |
| 3-12 | Mawlid al-Nabi -- "Birthday of Prophet Muhammad (PBUH)" |
| 7-27 | Isra & Mi'raj -- "Night Journey and Ascension of the Prophet" |
| 8-1 | Start of Sha'ban -- informational |
| 8-15 | Mid-Sha'ban -- "Night of forgiveness and blessings" |
| 9-1 | Start of Ramadan -- "Beginning of the month of fasting" |
| 9-21 | Laylat al-Qadr search begins -- odd nights |
| 9-23, 9-25, 9-27, 9-29 | Laylat al-Qadr (possible nights) -- "Better than a thousand months (Quran 97:3)" |
| 10-1 to 10-3 | Eid al-Fitr -- "Celebration marking the end of Ramadan" |
| 10-2 to 10-6 | Six days of Shawwal -- fasting recommended |
| 12-1 | Start of Dhul Hijjah |
| 12-1 to 12-9 | First 10 days of Dhul Hijjah -- blessed days |
| 12-8 | Day of Tarwiyah -- "Pilgrims prepare for Hajj" |
| 12-9 | Day of Arafah -- "Best day for du'a; fasting expiates two years of sins" |
| 12-10 to 12-13 | Eid al-Adha -- "Festival of Sacrifice" |

### 2. Deduplicate API holidays vs local events
**File:** `src/pages/spiritual/IslamicCalendar.tsx`

Update the `islamicEvents` filter and `getDayLabel` logic:
- When a day has BOTH a local `ISLAMIC_EVENTS` match AND `hijri.holidays[]` from the API, prefer our local event (which has bilingual names + descriptions) and skip the API holiday to avoid showing duplicates.
- Add a dedup check: normalize event names and skip API holidays that match a known local event.

### 3. Show short descriptions under event names
**File:** `src/pages/spiritual/IslamicCalendar.tsx`

In the "Islamic Events This Month" card, display the new `descEn`/`descAr` field as a small muted line under the event name. This gives users helpful context (e.g., "Fasting expiates two years of sins" for Arafah).

### 4. Group Sunnah fasting in Recommended Fasting section
Reduce noise by grouping consecutive Monday/Thursday entries and White Days into summary rows when there are many (e.g., "Every Monday & Thursday" header instead of listing all 8-9 individually). This keeps it clean and helpful.

## Files to modify
- `src/hooks/spiritual/useHijriCalendar.ts` -- expand `ISLAMIC_EVENTS` with descriptions and new dates
- `src/pages/spiritual/IslamicCalendar.tsx` -- dedup logic, show descriptions, simplify fasting list

## Technical notes
- No database or backend changes needed
- All new text is hardcoded bilingual (en/ar) in the events map, consistent with existing pattern
- RTL layout uses logical properties throughout (no changes needed)

