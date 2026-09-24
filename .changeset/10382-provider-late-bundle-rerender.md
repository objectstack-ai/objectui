---
'@object-ui/i18n': minor
---

Translations that `I18nProvider` loads after mount now reach the readers already
on screen (objectui#10382).

**The defect.** Both of the provider's asynchronous loads end in
`addResourceBundle`: the app bundle from `loadLanguage`, and the built-in
catalogue for the language the instance booted in. Each was followed by a "force
re-render" that set the provider's `language` state to the value it already held.
React bails out of a same-value update, so nothing re-rendered. A reader that drew
the fallback before the bundle arrived (an object label read through
`useObjectLabel`, for example) kept drawing the English source label until
something unrelated re-rendered it, with no error. The console wires
`loadLanguage` exactly this way, so whether authored translations appeared on
first load depended on timing.

**What changed.**

- `useObjectTranslation`, and every hook built on it (`useObjectLabel`,
  `useSafeTranslation`, `useDisplayLocale`), now subscribes each reader to the
  i18next store's `added` event through react-i18next's `bindI18nStore` option,
  passed per call. Every store write hands readers a new `t`, so a reader that
  memoises on `t`, or on a resolver built from it, recomputes too.
- The two same-value `setLanguage` calls are gone. The one after the app bundle
  also set the context's `language` back to the boot language when the user had
  switched while the bundle was in flight. The context now stays on the language
  i18next is on.
- The built-in catalogue is written only when the merge adds a key. That effect
  re-runs on every language change, and an unconditional write would re-render
  every reader for nothing.
- A switch through the context's `changeLanguage` writes its bundles silently,
  because the `languageChanged` that follows re-renders every reader once, in
  the new language.

**Behaviour you may notice.**

- On first load, a reader re-renders once when the app bundle lands, and once
  more if the built-in catalogue was not resident yet. Work keyed on `t` or on a
  label resolver runs again at that moment. For example, a chart that resolves
  group labels while it fetches will fetch again, so that its labels come from
  the new bundle.
- A language switch still re-renders each reader once.
- Host code that calls react-i18next's own `useTranslation` directly, rather
  than `useObjectTranslation`, is not subscribed. It keeps react-i18next's
  default, which re-renders on `languageChanged` only.

No export is added or removed. Marked `minor` rather than `patch` because the
first-load behaviour is observable.
