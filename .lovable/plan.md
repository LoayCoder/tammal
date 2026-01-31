
# Improve Tenant Sheet UX: Wizard-Style Navigation and Field Indicators

## Issues Identified

1. **Button shows "Save" instead of "Next"** - The footer always shows "Save" button, but for a multi-tab wizard, users expect "Next" to navigate between tabs and "Save" only on the final tab
2. **Terms checkbox in wrong location** - `terms_accepted` is currently in the General tab but should only appear in the final tab (Branding) before submission
3. **No mandatory field indicators** - Required fields lack visual distinction (asterisk/star icons) to show which fields are mandatory vs optional
4. **RTL compliance issue** - The terms checkbox uses `space-x-3` instead of `gap-3` for proper RTL support

## Solution Overview

Transform the tenant creation form from a tabbed form with a single "Save" button into a proper wizard-style flow with:
- **Previous/Next navigation** between tabs
- **"Save" button only on the final tab**
- **Terms acceptance moved to the last tab**
- **Required field indicators** with asterisks

## Implementation Details

### 1. Add Controlled Tab State

Replace `defaultValue="general"` with controlled state using `useState`:

```typescript
const [activeTab, setActiveTab] = useState('general');
const TAB_ORDER = ['general', 'contact', 'security', 'modules', 'branding'];
```

### 2. Update Footer with Wizard Navigation

Replace the static Save/Cancel footer with dynamic navigation:

| Current Tab | Left Button | Right Button |
|-------------|-------------|--------------|
| First tab (general) | Cancel | Next |
| Middle tabs | Previous | Next |
| Last tab (branding) | Previous | Save |

### 3. Move Terms Acceptance to Final Tab

- Remove `terms_accepted` FormField from the General tab
- Add it to the Branding tab (right before the submit action)
- Keep validation that terms must be accepted for new tenants only

### 4. Add Required Field Indicator Component

Create a reusable `RequiredIndicator` component (or inline span):

```tsx
<FormLabel>
  {t('tenants.name')} <span className="text-destructive">*</span>
</FormLabel>
```

Apply to all required fields:
- **General tab**: Name, Contact Email, Default Language, Status
- **Contact tab**: Contact Email (already shown in General)
- **Branding tab**: Terms Accepted (new tenants only)

### 5. Fix RTL Spacing in Terms Checkbox

Change from:
```tsx
<FormItem className="flex flex-row items-start space-x-3 space-y-0 ...">
```

To:
```tsx
<FormItem className="flex flex-row items-start gap-3 space-y-0 ...">
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/tenants/TenantSheet.tsx` | Add tab state, wizard navigation, move terms, add required indicators |
| `src/locales/en.json` | Add `common.previous` if missing (already exists: "Previous") |
| `src/locales/ar.json` | Add `common.previous` if missing (already exists: "السابق") |

## Technical Implementation

### TenantSheet.tsx Changes

1. **Add tab state and navigation helpers**:
```typescript
const [activeTab, setActiveTab] = useState('general');
const TAB_ORDER = ['general', 'contact', 'security', 'modules', 'branding'] as const;
const currentIndex = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]);
const isFirstTab = currentIndex === 0;
const isLastTab = currentIndex === TAB_ORDER.length - 1;

const handleNext = () => {
  if (!isLastTab) {
    setActiveTab(TAB_ORDER[currentIndex + 1]);
  }
};

const handlePrevious = () => {
  if (!isFirstTab) {
    setActiveTab(TAB_ORDER[currentIndex - 1]);
  }
};
```

2. **Update Tabs to use controlled value**:
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
```

3. **Update SheetFooter with conditional navigation**:
```tsx
<SheetFooter className="mt-6 flex justify-between">
  {isFirstTab ? (
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
      {t('common.cancel')}
    </Button>
  ) : (
    <Button type="button" variant="outline" onClick={handlePrevious}>
      {t('common.previous')}
    </Button>
  )}
  
  {isLastTab ? (
    <Button type="submit" form="tenant-form" disabled={isSubmitting}>
      {isSubmitting ? t('common.loading') : t('common.save')}
    </Button>
  ) : (
    <Button type="button" onClick={handleNext}>
      {t('common.next')}
    </Button>
  )}
</SheetFooter>
```

4. **Add required field indicator to labels**:
```tsx
<FormLabel>
  {t('tenants.name')} <span className="text-destructive">*</span>
</FormLabel>
```

5. **Move terms_accepted field to Branding tab**:
Move the entire FormField for `terms_accepted` from the General tab content to the end of the Branding tab content.

## Visual Flow After Implementation

```
Tab 1 (General)     Tab 2 (Contact)    Tab 3 (Security)   Tab 4 (Modules)    Tab 5 (Branding)
[Cancel] [Next] --> [Previous][Next] --> [Previous][Next] --> [Previous][Next] --> [Previous][Save]
                                                                                    + Terms Checkbox
```

## Expected Outcome

- Users navigate tabs sequentially with Previous/Next buttons
- "Save" only appears on the final tab, making it clear when submission happens
- Terms acceptance is the final step before saving (for new tenants)
- Required fields are clearly marked with red asterisks
- RTL support is maintained with logical properties
