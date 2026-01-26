
# Fix Remaining i18n Issues

## Summary
This plan addresses the remaining ~10% of i18n issues identified in the assessment report. Most translation keys already exist—the work is to update components to use them properly.

## What Will Be Fixed

### 1. AuditLogTable - Date Formatting with Locale
**File:** `src/components/audit/AuditLogTable.tsx`
- Lines 128, 182-184, 226: Replace `formatDistanceToNow` and `format` calls with locale-aware versions
- Import `ar` and `enUS` locales from date-fns
- Use `useTranslation` hook to determine the current language and pass appropriate locale

**Current:**
```typescript
format(new Date(log.created_at), 'PP')
formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
```

**After:**
```typescript
import { ar, enUS } from 'date-fns/locale';
const locale = i18n.language === 'ar' ? ar : enUS;
format(new Date(log.created_at), 'PP', { locale })
formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale })
```

### 2. AuditLogs CSV Export - Translation Keys
**File:** `src/pages/admin/AuditLogs.tsx`
- Line 57: Replace hardcoded English headers with translation keys from `csv.headers.*`

**Current:**
```typescript
const headers = ['Date', 'Entity Type', 'Entity ID', 'Action', 'Changes', 'User ID', 'Tenant ID'];
```

**After:**
```typescript
const headers = [
  t('csv.headers.date'),
  t('csv.headers.entityType'),
  t('csv.headers.entityId'),
  t('csv.headers.action'),
  t('csv.headers.changes'),
  t('csv.headers.userId'),
  t('csv.headers.tenantId')
];
```

### 3. InvitationManagement - Expiry Options & Placeholders
**File:** `src/components/tenants/InvitationManagement.tsx`
- Lines 37-43: Replace hardcoded `EXPIRY_OPTIONS` labels with translation keys
- Lines 239, 255: Use `t('placeholders.email')` and `t('placeholders.phoneShort')`

**Current:**
```typescript
const EXPIRY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
  ...
];
```

**After:** Create a function that returns translated options:
```typescript
const getExpiryOptions = (t: TFunction) => [
  { value: '1', label: t('expiryOptions.1day') },
  { value: '7', label: t('expiryOptions.7days') },
  ...
];
```

### 4. InvitationManagement - Date Formatting with Locale
**File:** `src/components/tenants/InvitationManagement.tsx`
- Line 185: Replace `format(new Date(invitation.expires_at), 'PP')` with locale-aware format

### 5. Carousel - SR-Only Text Translation
**File:** `src/components/ui/carousel.tsx`
- Line 189: Replace `"Previous slide"` with `{t('accessibility.previousSlide')}`
- Line 217: Replace `"Next slide"` with `{t('accessibility.nextSlide')}`
- Add `useTranslation` hook import

### 6. Sidebar - SR-Only and Aria Labels Translation
**File:** `src/components/ui/sidebar.tsx`
- Line 237: Replace `"Toggle Sidebar"` sr-only text with translation key
- Line 252: Replace `aria-label="Toggle Sidebar"` with translation key
- Line 255: Replace `title="Toggle Sidebar"` with translation key
- Add `useTranslation` hook import

### 7. Carousel Vertical Positioning (RTL)
**File:** `src/components/ui/carousel.tsx`
- Lines 181, 209: The `left-1/2 -translate-x-1/2` for vertical orientation needs RTL awareness
- Since vertical carousels still need horizontal centering regardless of text direction, this is actually correct behavior
- **No change needed** - the horizontal centering of vertical carousel buttons should remain consistent

### 8. Resizable Handle (RTL)
**File:** `src/components/ui/resizable.tsx`
- Line 24: Similar to carousel, `left-1/2` for centering the grip handle is for vertical positioning
- **No change needed** - the handle position should be centered regardless of RTL/LTR

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/audit/AuditLogTable.tsx` | Add locale imports, pass locale to date-fns functions |
| `src/pages/admin/AuditLogs.tsx` | Use translation keys for CSV headers |
| `src/components/tenants/InvitationManagement.tsx` | Use translation keys for expiry options, placeholders, and add locale to date formatting |
| `src/components/ui/carousel.tsx` | Add useTranslation, translate sr-only text |
| `src/components/ui/sidebar.tsx` | Add useTranslation, translate sr-only and aria-label text |

## Technical Details

### Date-fns Locale Import Pattern
```typescript
import { ar, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

// Inside component:
const { t, i18n } = useTranslation();
const dateLocale = i18n.language === 'ar' ? ar : enUS;
```

### Translation Key Pattern for UI Components
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  return <span className="sr-only">{t('accessibility.previousSlide')}</span>;
};
```

## Expected Outcome
After these changes:
- All dates will display in the correct locale format (Arabic/English)
- CSV exports will have localized headers
- All screen reader text will be properly translated
- Invitation expiry options will display in the user's language
- The system will achieve ~100% i18n compliance

## No Changes Needed
The following items from the original report have been verified as NOT needing changes:
- **Carousel vertical positioning**: `left-1/2` is correct for centering buttons on vertical carousels
- **Resizable handle positioning**: `left-1/2` is correct for centering the grip handle
- These use physical positioning for UI centering, not logical text flow
