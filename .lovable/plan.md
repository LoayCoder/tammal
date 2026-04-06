

# Add Arabic Translations to the Landing Page

## Current State
All 7 landing page components (Hero, Value, Showcase, Features, Visual, Trust, CTA, Nav, Footer) have **hardcoded English strings** with no `useTranslation()` hook. The i18n system (i18next + react-i18next) is already configured with `ar.json` and `en.json` locale files, but contains no landing page keys.

## What Changes

### 1. Add `landing` translation keys to both locale files

**`src/locales/en.json`** — Add a `"landing"` section with all current English text as-is.

**`src/locales/ar.json`** — Add a `"landing"` section with **proper formal Modern Standard Arabic (فصحى)**, not literal translations. Examples:

| English | Arabic (فصحى رسمية) |
|---------|---------------------|
| Enterprise Intelligence, Elevated. | ذكاء المؤسسات، بمستوى أرقى. |
| The AI-powered platform that transforms employee wellness... | المنصة المدعومة بالذكاء الاصطناعي التي تحوّل رفاهية الموظفين ومشاركتهم وأداءهم إلى ميزة استراتيجية. |
| Request Private Access | طلب وصول خاص |
| Enter Platform | الدخول إلى المنصة |
| Built for the Enterprise | مصمَّمة للمؤسسات |
| Intelligent Operations | عمليات ذكية |
| AI-driven workflows that learn, adapt, and optimize... | سير عمل مدعوم بالذكاء الاصطناعي يتعلّم ويتكيّف ويُحسّن — من متابعة الرفاهية إلى موازنة أعباء العمل. |
| Advanced Insights | رؤى تحليلية متقدمة |
| Executive Control | تحكّم إداري شامل |
| Every Tool Your Organization Needs | كل الأدوات التي تحتاجها مؤسستك |
| Enterprise-Grade by Design | بنية مؤسسية بالتصميم |
| Experience the Platform | اكتشف المنصة |
| Sign In | تسجيل الدخول |
| Get Access | احصل على الوصول |
| Why Tammal | لماذا تمّل |
| Capabilities | القدرات |
| Trust & Security | الثقة والأمان |
| The Experience | التجربة |
| Privacy / Terms / Security | الخصوصية / الشروط / الأمان |

All feature descriptions, showcase items, trust items, and stats will also be translated with **natural, idiomatic Arabic** — not word-for-word.

### 2. Integrate `useTranslation()` into all landing components

Each component will import `useTranslation` and replace hardcoded strings with `t('landing.xxx')` calls:

| File | Changes |
|------|---------|
| `LandingPage.tsx` | Nav links + footer text use `t()` |
| `LandingHero.tsx` | Badge, heading, subtext, buttons use `t()` |
| `LandingValue.tsx` | Section header + 3 value cards use `t()` |
| `LandingShowcase.tsx` | 3 showcase items (title + desc) use `t()` |
| `LandingFeatures.tsx` | Section header + 8 feature cards use `t()` |
| `LandingVisual.tsx` | Section header + subtitle use `t()` |
| `LandingTrust.tsx` | Section header, 4 stats, 4 trust items use `t()` |
| `LandingCTA.tsx` | Heading, subtitle, buttons use `t()` |

### 3. RTL compliance
The landing page already uses logical properties (`ps-`, `me-`, `start`, `end`) and `rtl:` variants on icons — so RTL layout will work automatically when the language switches to Arabic.

### Key Principle
All Arabic text will be **authored as natural فصحى**, using proper Arabic sentence structure, not mechanical translation. Descriptions will be rewritten to sound native and professional.

