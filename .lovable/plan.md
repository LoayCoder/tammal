

# Convert City and Country to Standard Dropdown Lists

## What Changes

Replace the free-text City and Country input fields in the Spiritual Preferences card with standard `Select` dropdown lists. Saudi Arabia will appear at the top of the country list, and the city list will dynamically update based on the selected country.

## Implementation Details

### 1. Create a Country/City Data File

**New file:** `src/data/countryCities.ts`

A structured data file containing:
- A list of countries with their codes (ISO 2-letter), English names, and Arabic names
- Saudi Arabia ("SA") placed first in the list
- For each country, a list of major cities with English and Arabic names

Countries to include (Saudi Arabia first, then alphabetical):
- Saudi Arabia (SA) -- with all major cities (Riyadh, Jeddah, Makkah, Madinah, Dammam, Khobar, Dhahran, Tabuk, Abha, Taif, Hail, Jazan, Najran, Buraidah, Yanbu, Al Jubail, etc.)
- United Arab Emirates (AE)
- Bahrain (BH)
- Kuwait (KW)
- Oman (OM)
- Qatar (QA)
- Egypt (EG)
- Jordan (JO)
- Iraq (IQ)
- Lebanon (LB)
- Palestine (PS)
- Syria (SY)
- Yemen (YE)
- Sudan (SD)
- Libya (LY)
- Tunisia (TN)
- Algeria (DZ)
- Morocco (MA)
- Turkey (TR)
- Pakistan (PK)
- Malaysia (MY)
- Indonesia (ID)
- United Kingdom (GB)
- United States (US)
- Canada (CA)
- Germany (DE)
- France (FR)

Each entry will include major cities relevant for prayer time calculations.

### 2. Update SpiritualPreferencesCard Component

**File:** `src/components/spiritual/SpiritualPreferencesCard.tsx`

Changes:
- Import the country/city data
- Replace the Country `Input` (line 143-148) with a `Select` dropdown showing country names (Arabic or English based on locale), with Saudi Arabia at the top
- Replace the City `Input` (line 135-139) with a `Select` dropdown that filters cities based on the selected country
- When country changes, auto-clear the city if it doesn't belong to the new country
- The country field stores the ISO code (e.g., "SA") which is what the Aladhan API expects

### 3. Add Translation Keys

**Files:** `src/locales/en.json` and `src/locales/ar.json`

Add:
- `spiritual.preferences.selectCountry` -- placeholder text
- `spiritual.preferences.selectCity` -- placeholder text

### Technical Notes

- The Aladhan prayer times API (`/v1/timingsByCity`) accepts city name and country code, so the dropdown values align perfectly with the existing API integration
- No database changes needed -- the `city` and `country` columns remain text fields storing the same values
- The Select component uses Shadcn's `Select` already imported in the file
- A `ScrollArea` will wrap the dropdown content for long lists
