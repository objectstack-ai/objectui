---
'@object-ui/i18n': minor
---

A region-tagged language code reaches the built-in catalogue of its base language (objectui#11326)

The built-in catalogues are keyed by base language (`zh`), while the platform
answers, the Console's language menu offers, and the provider stores full
BCP-47 tags (`zh-CN`). `isBuiltInLanguage` and `loadBuiltInLocale` looked a code
up exactly, so `loadBuiltInLocale('zh-CN')` resolved `null`. A user who picked
中文（中国） got every built-in string in English on each full page load, with
only the `en` catalogue fetched, while server-translated labels stayed Chinese.

**What changed at the contract.** Three exported registry functions now accept a
region-tagged code they used to refuse. A code is looked up exact tag first,
then its base language, through one normaliser. That is the order the cached
locale seed already used, and the seed now reuses the same function.

- `loadBuiltInLocale('zh-CN')` resolves the `zh` catalogue. It is fetched and
  memoised under `zh`, so `zh` and `zh-CN` share one fetch, and
  `getLoadedBuiltInLocales()` stays keyed by catalogue code.
- `isBuiltInLanguage('zh-CN')` is `true`, and `isBuiltInLocaleLoaded('zh-CN')`
  answers for the `zh` catalogue.
- A code with no catalogue for the tag or for its base (`xx-YY`, `tlh`) is
  refused exactly as before.
- A catalogue keyed by a full tag would win over its base language. None ships
  today.

**What a host observes.**

- A stored `zh-CN` is kept, and kept as written. `I18nProvider` boots in
  `zh-CN` and renders from the `zh` catalogue, and its `language`, the
  document's `lang` attribute and the stored value all stay `zh-CN`. A host with no
  `loadLanguage` loader used to purge a stored `zh-CN` on boot. It no longer
  does.
- `preloadBootstrapLocale()` fetches the `zh` catalogue for a stored `zh-CN`, so
  the first paint is already Chinese.
- `changeLanguage('zh-CN')` fetches the `zh` catalogue before it switches.
- A cached locale seed of `zh-CN` now boots in `zh-CN` instead of being
  rewritten to `zh`, because the `zh` catalogue serves the exact tag. The
  strings are the same. The provider's `language` and the document's `lang`
  attribute read `zh-CN`, the tag the signed-in user's `sys_user.locale` applies a moment
  later.
