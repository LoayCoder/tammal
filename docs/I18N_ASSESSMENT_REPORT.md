# Internationalization (i18n) & Localization (l10n) Assessment Report

**Project:** Tammal
**Date:** 2026-01-26
**Scope:** Arabic–English Bilingual Enterprise System
**Assessor:** Claude AI

---

## Executive Summary

The Tammal application demonstrates a **well-structured i18n foundation** using i18next with react-i18next. The system supports Arabic (RTL) and English (LTR) with 972 translation keys in each language file. However, several issues require attention to achieve full bilingual compliance.

### Overall Assessment: **75-80% Complete**

| Category | Status | Severity |
|----------|--------|----------|
| Translation Files Structure | ✅ Excellent | - |
| Core i18n Configuration | ✅ Good | - |
| RTL/LTR Global Handling | ✅ Good | - |
| Hardcoded Strings | ⚠️ Issues Found | High |
| Component RTL Styling | ⚠️ Issues Found | Medium |
| Date/Number Formatting | ⚠️ Issues Found | Medium |
| Email Templates | ❌ Not Localized | High |
| Translation Accuracy | ✅ Good | Low |

---

## 1. TRANSLATION SYSTEM ARCHITECTURE

### 1.1 Current Implementation ✅

**Stack:**
- i18next v25.7.3
- react-i18next v16.5.0
- i18next-browser-languagedetector v8.2.0

**Translation Files:**
- `/src/locales/en.json` - 972 keys
- `/src/locales/ar.json` - 972 keys

**Configuration:** `/src/lib/i18n.ts`
```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });
```

**Language Switching:** Real-time switching without page reload ✅

### 1.2 Bilingual Database Fields ✅

The system properly supports bilingual content in database:
- `roles`: `name`, `name_ar`, `description`, `description_ar`
- `branches`: `name`, `name_ar`, `address`, `address_ar`
- `sites`: `name`, `name_ar`, `address`, `address_ar`
- `questions`: `text`, `text_ar`
- `categories`: `name`, `name_ar`, `description_ar`

---

## 2. HARDCODED STRINGS - ISSUES FOUND

### 2.1 High Priority - User-Facing Text

| File | Line | Hardcoded String | Recommended Key |
|------|------|------------------|-----------------|
| `src/pages/Auth.tsx` | 15-16 | `'Invalid email address'`, `'Password must be at least 6 characters'` | `auth.validation.invalidEmail`, `auth.validation.passwordMinLength` |
| `src/pages/Auth.tsx` | 73-92 | `'Error'`, `'Success'`, `'Logged in successfully'`, `'Account created successfully...'` | `auth.toast.*` |
| `src/pages/NotFound.tsx` | 14-17 | `"404"`, `"Oops! Page not found"`, `"Return to Home"` | `errors.notFound.*` |
| `src/pages/Index.tsx` | 7-8 | `"Welcome to Your Blank App"`, `"Start building..."` | `home.*` |
| `src/components/roles/RoleDialog.tsx` | 36, 41 | `'Role name is required'`, `'Invalid color format'` | `roles.validation.*` |
| `src/components/auth/PermissionGate.tsx` | 58 | `"You don't have permission..."` | `permissions.noAccess` (exists) |

### 2.2 Medium Priority - Accessibility Labels

| File | Line | Hardcoded String |
|------|------|------------------|
| `src/components/LanguageSelector.tsx` | 28 | `aria-label="Select language"` |
| `src/components/ThemeToggle.tsx` | 13 | `aria-label="Toggle theme"` |
| `src/components/ui/sidebar.tsx` | 237-255 | `"Toggle Sidebar"` (multiple) |
| `src/components/ui/pagination.tsx` | 10-68 | `"pagination"`, `"Previous"`, `"Next"`, `"More pages"` |
| `src/components/ui/breadcrumb.tsx` | 12, 77 | `"breadcrumb"`, `"More"` |
| `src/components/ui/carousel.tsx` | 189, 217 | `"Previous slide"`, `"Next slide"` |
| `src/components/ui/sheet.tsx` | 62 | `"Close"` |
| `src/components/ui/dialog.tsx` | 47 | `"Close"` |

### 2.3 Medium Priority - Placeholders

| File | Line | Placeholder |
|------|------|-------------|
| `src/pages/Auth.tsx` | 135 | `placeholder="name@example.com"` |
| `src/components/users/InviteUserDialog.tsx` | 90, 112 | `"user@example.com"`, `"+966 5XX XXX XXXX"` |
| `src/components/tenants/InvitationManagement.tsx` | 239, 255 | `"user@example.com"`, `"+966XXXXXXXXX"` |
| `src/components/roles/RoleDialog.tsx` | 135, 148 | `"e.g., Safety Officer"`, `"مثال: مسؤول السلامة"` |
| `src/components/tenants/TenantSheet.tsx` | 234, 249 | `"company-name"`, `"example.com"` |

### 2.4 Low Priority - Image Alt Text

| File | Line | Alt Text |
|------|------|----------|
| `src/components/branding/BrandingPreview.tsx` | 42, 140 | `"Logo preview"`, `"Header logo"` |
| `src/pages/InstallApp.tsx` | 68 | `"App Logo"` |
| `src/components/profile/EditProfileDialog.tsx` | 180 | `"Avatar"` |
| `src/components/profile/MFASetupDialog.tsx` | 232 | `"MFA QR Code"` |

### 2.5 Hardcoded Constants

| File | Line | Content |
|------|------|---------|
| `src/components/tenants/InvitationManagement.tsx` | 38-42 | Expiry options: `'1 day', '7 days', '14 days', '30 days', '90 days'` |
| `src/pages/admin/AuditLogs.tsx` | 57, 77 | CSV headers: `'Date', 'Entity Type', 'Entity ID'...` |

---

## 3. RTL/LTR ISSUES

### 3.1 Global RTL Setup ✅

**File:** `/src/App.tsx` (lines 35-42)
```typescript
const I18nDirection = () => {
  const { i18n } = useTranslation();
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  return null;
};
```

### 3.2 Tailwind RTL Support ✅

Properly implemented:
- `rtl:rotate-180` for icon rotation (8 instances)
- `rtl:space-x-reverse` for flex layouts
- Logical properties: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`
- Sheet animations with RTL variants

### 3.3 Component RTL Issues - HIGH PRIORITY

#### Issue 1: Dialog/AlertDialog Centering
**Files:** `src/components/ui/dialog.tsx:39`, `src/components/ui/alert-dialog.tsx:37`

**Problem:**
```css
"fixed left-[50%] top-[50%] ... translate-x-[-50%] ...
data-[state=closed]:slide-out-to-left-1/2"
```

**Impact:** Dialogs will be off-center in RTL mode.

**Fix Required:**
```css
"fixed inset-0 flex items-center justify-center"
/* OR use logical centering */
```

#### Issue 2: Alert Component Icon Positioning
**File:** `src/components/ui/alert.tsx:7`

**Problem:**
```css
"[&>svg]:absolute [&>svg]:left-4 ... [&>svg~*]:pl-7"
```

**Fix Required:**
```css
"[&>svg]:absolute [&>svg]:start-4 ... [&>svg~*]:ps-7"
```

#### Issue 3: Toast Component Padding
**File:** `src/components/ui/toast.tsx:26`

**Problem:**
```css
"... p-6 pr-8 ... data-[swipe=cancel]:translate-x-0"
```

**Fix Required:**
```css
"p-6 pe-8" /* and handle RTL swipe direction */
```

#### Issue 4: Carousel Vertical Positioning
**File:** `src/components/ui/carousel.tsx:181, 209`

**Problem:** `left-1/2 -translate-x-1/2` not RTL-aware for vertical orientation.

#### Issue 5: Resizable Handle
**File:** `src/components/ui/resizable.tsx:24`

**Problem:** Uses `left-1/2` positioning.

### 3.4 Input Direction Handling ✅

Properly implemented for:
- Phone numbers: `dir="ltr"`
- Email addresses: `dir="ltr"`
- Business registration numbers: `dir="ltr"`
- Arabic descriptions: `dir="rtl"`
- Mixed content: `dir="auto"`

---

## 4. DATE/NUMBER FORMATTING ISSUES

### 4.1 Inconsistent Locale Handling

| File | Issue | Current | Required |
|------|-------|---------|----------|
| `src/pages/Dashboard.tsx:17` | Currency format | `'en-US'` hardcoded | Language-aware |
| `src/components/plans/PlanTable.tsx:33` | Price format | `'en-US'` hardcoded | Language-aware |
| `src/components/audit/AuditLogTable.tsx:182` | Date format | `format(date, 'PP')` | Locale-aware format |
| `src/components/roles/RoleTable.tsx:103` | Date format | `format(date, 'MMM d, yyyy')` | Locale-aware format |
| `src/components/users/UserTable.tsx:119` | Date format | `format(date, 'MMM d, yyyy')` | Locale-aware format |
| `src/components/tenants/TenantTable.tsx:93` | Date format | `toLocaleDateString()` no locale | Pass locale |
| `src/components/employees/EmployeeTable.tsx:66` | Date format | `format(date, 'PP')` | Locale-aware format |

### 4.2 Correct Implementations ✅

These files correctly handle locale:
- `src/pages/settings/UserProfile.tsx` - Uses `isRTL ? 'ar-SA' : 'en-US'`
- `src/components/profile/LoginActivityDialog.tsx` - Uses `isRTL ? 'ar-SA' : 'en-US'`
- `src/components/profile/SessionManagementDialog.tsx` - Uses `isRTL ? 'ar-SA' : 'en-US'`

### 4.3 Recommended Pattern

```typescript
import { ar, enUS } from 'date-fns/locale';

const { i18n } = useTranslation();
const locale = i18n.language === 'ar' ? ar : enUS;

// For date-fns
format(new Date(date), 'PP', { locale });

// For Intl
new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', options);
new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', options);
```

---

## 5. EMAIL TEMPLATES - NOT LOCALIZED

### 5.1 Critical Issue

**File:** `supabase/functions/send-invitation-email/index.ts`

The invitation email is completely hardcoded in English:
- Subject: `"You've been invited to join ${tenantName}"`
- Body: English-only HTML template
- Date format: `'en-US'` hardcoded

### 5.2 Required Changes

1. Accept `language` parameter in email request
2. Create bilingual email templates
3. Use locale-appropriate date formatting
4. Translate all email content including:
   - Subject line
   - Greeting
   - Body text
   - Button labels
   - Footer text

---

## 6. TRANSLATION ACCURACY REVIEW

### 6.1 Quality Assessment ✅

The Arabic translations are of **high quality** using Modern Standard Arabic (MSA). Key observations:

**Positive:**
- Consistent terminology throughout
- Appropriate formality level for enterprise software
- Technical terms properly translated
- Grammar and syntax correct

### 6.2 Minor Issues Found

| Key | English | Arabic | Suggestion |
|-----|---------|--------|------------|
| `roles.baseRoles.manager` | Manager | مشرف | Consider "مدير" for consistency |
| `roles.baseRoles.superAdmin` | Super Admin | المدير الأعلى | Consider "المسؤول الأعلى" |
| `questions.questionTextPlaceholder` | Enter your question here... | (Not translated - English in AR file) | أدخل سؤالك هنا... |

### 6.3 Untranslated String Found

**File:** `src/locales/ar.json` line 605
```json
"questionTextPlaceholder": "Enter your question here..."
```
Should be:
```json
"questionTextPlaceholder": "أدخل سؤالك هنا..."
```

Note: The key `questionTextPlaceholderAr` exists and is correctly translated. This appears to be intentional for the English placeholder field.

---

## 7. MISSING TRANSLATIONS

### 7.1 Keys That Should Be Added

```json
{
  "accessibility": {
    "selectLanguage": "Select language / اختر اللغة",
    "toggleTheme": "Toggle theme / تبديل السمة",
    "toggleSidebar": "Toggle sidebar / تبديل الشريط الجانبي",
    "close": "Close / إغلاق",
    "pagination": "Pagination / التصفح",
    "previousPage": "Go to previous page / الذهاب للصفحة السابقة",
    "nextPage": "Go to next page / الذهاب للصفحة التالية",
    "morePages": "More pages / المزيد من الصفحات",
    "breadcrumb": "Breadcrumb / مسار التنقل",
    "previousSlide": "Previous slide / الشريحة السابقة",
    "nextSlide": "Next slide / الشريحة التالية"
  },
  "errors": {
    "notFound": {
      "title": "404",
      "message": "Oops! Page not found / عفواً! الصفحة غير موجودة",
      "returnHome": "Return to Home / العودة للرئيسية"
    }
  },
  "placeholders": {
    "email": "name@example.com",
    "phone": "+966 5XX XXX XXXX",
    "companySlug": "company-name",
    "domain": "example.com"
  },
  "imageAlt": {
    "logoPreview": "Logo preview / معاينة الشعار",
    "headerLogo": "Header logo / شعار الرأس",
    "appLogo": "App Logo / شعار التطبيق",
    "avatar": "Avatar / الصورة الرمزية",
    "mfaQrCode": "MFA QR Code / رمز QR للمصادقة"
  },
  "csv": {
    "headers": {
      "date": "Date / التاريخ",
      "entityType": "Entity Type / نوع الكيان",
      "entityId": "Entity ID / معرف الكيان",
      "action": "Action / الإجراء",
      "changes": "Changes / التغييرات",
      "userId": "User ID / معرف المستخدم",
      "tenantId": "Tenant ID / معرف المستأجر"
    }
  },
  "expiryOptions": {
    "1day": "1 day / يوم واحد",
    "7days": "7 days / 7 أيام",
    "14days": "14 days / 14 يوم",
    "30days": "30 days / 30 يوم",
    "90days": "90 days / 90 يوم"
  }
}
```

---

## 8. RECOMMENDATIONS

### 8.1 High Priority Fixes

1. **Localize Email Templates**
   - Add language parameter to email functions
   - Create Arabic email template variants
   - Use locale-aware date formatting in emails

2. **Fix Dialog/Alert RTL Centering**
   - Replace `left-[50%]` with logical centering
   - Test all dialogs in RTL mode

3. **Add Missing Translation Keys**
   - Create `accessibility` namespace
   - Create `errors` namespace
   - Create `placeholders` namespace

4. **Fix Toast Validation Messages**
   - Replace hardcoded error/success messages with translation keys

### 8.2 Medium Priority Fixes

1. **Standardize Date/Number Formatting**
   - Create utility functions for locale-aware formatting
   - Replace all hardcoded 'en-US' locales

2. **Fix Alert/Toast RTL Styling**
   - Change `left-4` to `start-4`
   - Change `pl-7` to `ps-7`
   - Change `pr-8` to `pe-8`

3. **Add Accessibility Translations**
   - Translate all aria-labels
   - Translate all sr-only text

### 8.3 Low Priority Fixes

1. **Image Alt Text Translations**
   - Add translation keys for all image alt attributes

2. **Console Messages**
   - While not user-facing, consider localizing error logs for debugging

3. **CSV Export Headers**
   - Add translation support for exported file headers

---

## 9. TESTING CHECKLIST

### Pre-Release RTL Testing

- [ ] All dialogs center correctly in RTL
- [ ] All icons rotate appropriately in RTL
- [ ] All form inputs align correctly
- [ ] Navigation flows right-to-left
- [ ] Tables display correctly
- [ ] Pagination controls work in RTL
- [ ] Date/time formats use Arabic locale
- [ ] Numbers display correctly (Arabic or Western numerals)
- [ ] Mixed Arabic-English content renders correctly
- [ ] Email notifications sent in correct language

### Translation Coverage Testing

- [ ] All UI labels translated
- [ ] All error messages translated
- [ ] All validation messages translated
- [ ] All toast notifications translated
- [ ] All form placeholders have appropriate text
- [ ] All accessibility labels translated

---

## 10. CONFIRMATION

### System Support Status

| Feature | Arabic | English | Status |
|---------|--------|---------|--------|
| UI Labels | ✅ 972 keys | ✅ 972 keys | Complete |
| Navigation | ✅ | ✅ | Complete |
| Forms | ✅ | ✅ | Complete |
| Validation Messages | ⚠️ Partial | ⚠️ Partial | Needs work |
| Toast Notifications | ⚠️ Partial | ⚠️ Partial | Needs work |
| Email Notifications | ❌ | ✅ | Needs implementation |
| PDF Exports | ❓ | ❓ | Not assessed |
| API Responses | ✅ | ✅ | Database supports bilingual |
| RTL Layout | ⚠️ 80% | ✅ | Minor fixes needed |
| Date Formatting | ⚠️ Partial | ⚠️ Partial | Standardization needed |
| Number Formatting | ⚠️ Partial | ⚠️ Partial | Standardization needed |

### Conclusion

The Tammal application has a **solid i18n foundation** that requires targeted fixes to achieve full Arabic–English bilingual support. The primary areas requiring attention are:

1. Email template localization
2. Dialog RTL centering
3. Date/number formatting standardization
4. Hardcoded string cleanup

With the recommended fixes implemented, the system will be fully compliant for Arabic–English bilingual enterprise use.

---

*Report generated by automated i18n assessment*
