# @object-ui/i18n

Internationalization for Object UI — 11 built-in locales, RTL support, and date/currency formatting.

## Features

- 🌍 **11 Built-in Locales** - English, Chinese, Japanese, Korean, German, French, Spanish, Portuguese, Russian, Arabic, and more
- 🔄 **RTL Support** - Automatic right-to-left layout for Arabic and other RTL languages
- 📅 **Date Formatting** - Locale-aware date, datetime, and relative time formatting
- 💰 **Currency & Number Formatting** - Locale-aware currency and number formatting
- 🎣 **React Hooks** - `useObjectTranslation` for translations, language switching, and direction
- 🏗️ **I18nProvider** - Context provider for internationalized applications
- 🪶 **Lazy catalogues** - only the active locale's catalogue is fetched; the other nine are separate chunks
- 🔌 **Extensible** - Add custom locales and translation keys
- 🎯 **Type-Safe** - Full TypeScript support with exported types

## Installation

```bash
npm install @object-ui/i18n
```

**Peer Dependencies:**
- `react` ^18.0.0 || ^19.0.0

## Quick Start

```tsx
import { I18nProvider, useObjectTranslation } from '@object-ui/i18n';

function App() {
  return (
    <I18nProvider config={{ defaultLanguage: 'en' }}>
      <MyComponent />
    </I18nProvider>
  );
}

function MyComponent() {
  const { t, language, changeLanguage, direction } = useObjectTranslation();

  return (
    <div dir={direction}>
      <h1>{t('common.save')}</h1>
      <button onClick={() => changeLanguage('zh')}>Chinese</button>
      <button onClick={() => changeLanguage('ar')}>العربية</button>
    </div>
  );
}
```

## API

### I18nProvider

Wraps your application with i18n context:

```tsx
import type { ReactNode } from 'react';
import { I18nProvider } from '@object-ui/i18n';

// Your app supplies the tree being wrapped.
declare const App: () => ReactNode;

<I18nProvider config={{ defaultLanguage: 'en', fallbackLanguage: 'en' }}>
  <App />
</I18nProvider>;
```

#### Language persistence

The active language is a **user preference**, so it survives a reload: every
language change is written to `localStorage` under `objectui-locale`
(`LOCALE_STORAGE_KEY`), and the provider boots the next session in that
language.

Precedence at bootstrap: **stored choice → browser language → `defaultLanguage`**.
An explicit choice outranks browser detection — otherwise a user who picked 中文
on a `ja` browser would be handed `ja` back on every reload. A stored value the
app no longer offers (not a built-in pack, not in `config.resources`) is ignored
*and purged*, so a stale entry can never lock the UI to a locale with no
translations.

```tsx
import type { ReactNode } from 'react';
import { I18nProvider } from '@object-ui/i18n';

declare const Preview: () => ReactNode;

// Fixed-language surfaces (previews, demos, screenshot harnesses) opt out —
// they neither restore nor write the preference.
<I18nProvider config={{ defaultLanguage: 'en' }} persistLanguage={false}>
  <Preview />
</I18nProvider>;
```

Bringing your own `instance`? Then its bootstrap language is yours to choose —
read the preference with `readStoredLanguage()` and pass it to `createI18n`.
Switching through such an instance is still persisted.

### useObjectTranslation

Hook for translations and language management:

```tsx
import { useObjectTranslation } from '@object-ui/i18n';

function LanguageBar() {
  const { t, language, changeLanguage, direction } = useObjectTranslation();

  return (
    <div dir={direction}>
      {t('common.save')} — {language}
      <button onClick={() => changeLanguage('zh')}>中文</button>
    </div>
  );
}
```

### createI18n

Factory for creating an i18n instance outside React:

```tsx
import { createI18n } from '@object-ui/i18n';

const i18n = createI18n({ defaultLanguage: 'de' });
i18n.t('common.cancel'); // "Abbrechen"
```

### Formatting Utilities

Locale-aware formatting functions:

Each formatter takes the value first and an **options object** second; the
locale is a field on that object (`DateFormatOptions`, `CurrencyFormatOptions`,
`NumberFormatOptions`), never a positional argument. `formatRelativeTime` is the
one exception: it takes the locale directly, and derives the unit from how far
the date is from now.

```tsx
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from '@object-ui/i18n';

formatDate(new Date(2025, 0, 1), { locale: 'en' });              // "Jan 1, 2025"
formatCurrency(99.99, { currency: 'USD', locale: 'en' });        // "$99.99"
formatNumber(1234567, { locale: 'de' });                         // "1.234.567"
formatRelativeTime(Date.now() - 3 * 86_400_000, 'en');           // "3 days ago"
```

### Built-in locales — one is resident, nine are fetched on demand

The package entry re-exports **`en` only**. It is `fallbackLng`, it is the
source of the `TranslationKeys` type, and it is the synchronous dictionary the
app-shell splash renders from before i18n is usable, so it has to be there
without awaiting anything. The other nine catalogues are separate chunks your
bundler emits once each and the browser fetches only when that locale is
actually used — roughly 400 KB gzipped that a page load no longer pays
(objectui#7479).

```tsx
import {
  en,                        // resident
  BUILT_IN_LANGUAGE_CODES,   // all ten codes, no catalogue payload
  isBuiltInLanguage,
  loadBuiltInLocale,         // fetch one: Promise<catalogue | null>
  getLoadedBuiltInLocales,   // synchronous snapshot of what is resident
} from '@object-ui/i18n';

BUILT_IN_LANGUAGE_CODES;            // ['en','zh','ja','ko','de','fr','es','pt','ru','ar']
await loadBuiltInLocale('zh');      // the zh catalogue, fetched once and memoised
await loadBuiltInLocale('tlh');     // null — not a code this package ships
```

`I18nProvider` does this for you: it fetches the catalogue for whatever language
it boots into, and `changeLanguage()` awaits the new catalogue before switching,
so a switcher needs no extra wiring.

#### Resolving before the first render

Without a resolve, a provider booting into `zh` paints once through the `en`
fallback — correct strings, never a raw key — and re-renders in Chinese when the
catalogue lands. If your app already awaits something before mounting, spend
that await here instead and the first paint is already right:

```tsx
import { I18nProvider, preloadBootstrapLocale, resolveBootstrapLanguage } from '@object-ui/i18n';
import { createRoot } from 'react-dom/client';
import type { FC } from 'react';

declare const App: FC;
declare const container: HTMLElement;
declare const loadLanguage: (lang: string) => Promise<Record<string, unknown>>;

// Pass the SAME options you will pass to <I18nProvider>, or the two will
// disagree about which language this boot is in.
await preloadBootstrapLocale({ hasLoader: true });
createRoot(container).render(
  <I18nProvider loadLanguage={loadLanguage}>
    <App />
  </I18nProvider>,
);

resolveBootstrapLanguage({ hasLoader: true }); // 'zh' — the same answer, no fetch
```

`preloadBootstrapLocale` never rejects: a catalogue that will not download must
not take the boot down, and the provider retries on mount.
`apps/console/src/main.tsx` is the worked example.

#### When you really do want all ten

The parity suites do, and so does an app that ships every language resident. The
door is a separate specifier, so the cost is visible at the import site:

```tsx
import { builtInLocales, zh, ru } from '@object-ui/i18n/locales';
```

⚠️ That module statically imports every catalogue. Never reach for it on a
page-load path — that is exactly the eager payload the split removed.

### RTL Helpers

```tsx
import { isRTL, RTL_LANGUAGES } from '@object-ui/i18n';

isRTL('ar'); // true
isRTL('en'); // false
```

### Localized value helpers — reading and editing an `I18nLabel`

Server-driven metadata types a label as a plain string **or** an inline
per-locale map (`{ en: 'Pricing', 'zh-CN': '定价' }`). An authoring surface that
shows one locale in one text input has to answer three separate questions, so
there are three functions and each answers exactly one:

```tsx
import { pickLocalized, setLocalized, clearLocalized } from '@object-ui/i18n';

const stored = { en: 'Pricing', 'zh-CN': '定价' };

pickLocalized(stored, 'en-US');          // 'Pricing'   — which entry to DISPLAY
setLocalized(stored, 'en-US', 'Plans');  // { en: 'Plans', 'zh-CN': '定价' }
clearLocalized(stored, 'en-US');         // { 'zh-CN': '定价' }
```

⛔ Never write the input's string back as the whole value — that replaces the
map and every locale the author was not looking at is gone, silently, on the
first keystroke. `setLocalized` replaces **one** entry (adding it when the
active locale has none) and `clearLocalized` removes **one** entry (returning
`undefined` once nothing localized is left). Both choose that entry with the
same limbs, and deliberately stop short of `pickLocalized`'s display-only
fallbacks, so an author editing in `fr` while shown the `en` string can neither
overwrite nor delete English.

## Scope — the `engine.*` carve-out (metadata-admin / Studio)

Not every user-facing string in this repository resolves through these packs.
The metadata-admin (Studio) surface — the metadata directory, the inspectors,
package management, the flow designer and their refusal messages — resolves its
`engine.*` keys through a module-local **two-locale** table in
[`packages/app-shell/src/views/metadata-admin/i18n.ts`](../app-shell/src/views/metadata-admin/i18n.ts):
a plain `Record` lookup over `en-US` and `zh-CN`, not an i18next namespace.
Roughly 1,300 keys per locale live there, and **no `engine.*` key exists in any
of the ten packs.**

That is design, not drift — the file's header records it as "Phase 3f". The
server holds the primary path: the engine consumes `label` from the
`/meta/types` response, sourced from the platform's metadata-type registry. The
module-local table is a **fallback** for deployments with no translation bundles
configured, and the interim source of truth for Chinese until the platform's
`setup.translation.ts` ships zh-CN coverage. Copying the namespace into the
packs would duplicate strings whose primary source is a server response.

Two consequences follow, and both are accepted rather than outstanding work:

- **Only `en` and `zh` are covered.** On an `ar` / `de` / `es` / `fr` / `ja` /
  `ko` / `pt` / `ru` console, `engine.*` strings render English. That is the
  price of the carve-out, not a backfill someone forgot.
- **The i18n gates cannot see this namespace, by construction.** Key parity
  ([`src/__tests__/all-locales-key-parity.test.ts`](./src/__tests__/all-locales-key-parity.test.ts))
  compares pack against pack, and `engine.*` is in no pack — so it is not an
  *exception* to that test, it is outside its subject. The call-site gate
  ([`scripts/check-i18n-call-site-keys.mjs`](../../scripts/check-i18n-call-site-keys.mjs))
  skips these call sites **by declaration**: the module is registered in its
  `EXCLUDED_TRANSLATORS` list with a reason, and an imported `t` from any
  unregistered module is a hard error there — so a second local table cannot
  appear silently, and this carve-out cannot quietly widen.

**When to revisit.** Migrating the namespace into the packs is mechanical but
wide (~1,300 keys × 8 further locales) and argues against the server-driven
design above, so it is not worth doing speculatively. The condition to reopen it
is concrete: a stated demand for an admin console in a language other than `en`
or `zh` — not a general wish for broader locale coverage, which the packs
already serve on every other surface. See objectui#4662 for the measurement and
the ruling.

## Links

- 📦 [npm package](https://www.npmjs.com/package/@object-ui/i18n)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Report an issue](https://github.com/objectstack-ai/objectui/issues)
- 🤝 [Contributing Guide](https://github.com/objectstack-ai/objectui/blob/main/CONTRIBUTING.md)
- 🗺️ [Roadmap](https://github.com/objectstack-ai/objectui/blob/main/ROADMAP.md)

## License

MIT — see [LICENSE](./LICENSE).
