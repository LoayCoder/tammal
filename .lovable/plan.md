

# Fix Duplicate Translation Keys in JSON Files

## Problem Identified
The translation files (`en.json` and `ar.json`) have **duplicate `"common"` keys** that are causing translation failures:

- **First `"common"` object** (lines 2-25): Contains the original translations like `noData`, `active`, `inactive`, `suspended`, `trial`, etc.
- **Second `"common"` object** (lines 970-977): Contains newer keys like `done`, `close`, `previous`, `more`, `error`, `success`

When JSON is parsed, duplicate keys cause the **second object to completely overwrite the first**, resulting in the loss of all original translations including `noData`.

## Why This Happened
When adding new translation keys in a previous edit, they were appended as a new `"common"` block instead of being merged into the existing one. JSON does not support duplicate keys.

## Solution
Merge the keys from the second `"common"` object into the first one and remove the duplicate block.

### Changes to `src/locales/en.json`

1. Add these keys to the first `"common"` object (around line 24):
```json
"done": "Done",
"close": "Close",
"previous": "Previous",
"more": "More",
"error": "Error",
"success": "Success"
```

2. Delete the duplicate `"common"` object at lines 970-977

### Changes to `src/locales/ar.json`

1. Add these keys to the first `"common"` object (around line 24):
```json
"done": "تم",
"close": "إغلاق",
"previous": "السابق",
"more": "المزيد",
"error": "خطأ",
"success": "نجاح"
```

2. Delete the duplicate `"common"` object at lines 970-977

## Files to Modify

| File | Action |
|------|--------|
| `src/locales/en.json` | Merge second `common` into first, delete duplicate |
| `src/locales/ar.json` | Merge second `common` into first, delete duplicate |

## Expected Result
After this fix:
- `t('common.noData')` will correctly return "No data available" (EN) or "لا توجد بيانات" (AR)
- All other `common.*` translations will work correctly
- The duplicate key warning/error will be resolved

## Technical Note
This is a JSON structure fix, not a code change. The translation files must have unique top-level keys for proper parsing.

