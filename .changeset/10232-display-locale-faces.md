---
'@object-ui/app-shell': patch
'@object-ui/plugin-ai': patch
'@object-ui/i18n': patch
---

Two display-locale faces now follow the session's display locale (objectui#10232).

- `@object-ui/plugin-ai` is wired to `@object-ui/i18n` as a whole. The `nl-query`,
  `ai-form-assist` and `ai-recommendations` components read their strings from a new
  `ai.*` namespace, translated in all ten locale packs, instead of hard-coded English.
  The `nl-query` history date, which was formatted in the machine's locale, and the
  confidence and score percentages now format in the display locale
  (`useDisplayLocale()`). The package's manifest now names `@object-ui/i18n`, which also
  puts it inside the repo-wide machine-locale census.
- `@object-ui/app-shell`: the Studio home page's "recently viewed" times and the Data
  pillar's last-saved time format in the display locale. They used to be handed
  `useMetadataLocale()`, which picks the designer's string table and is `en-US` for every
  language other than zh, so a de-DE session read US English. That hook's doc comment
  now says it must never be used as an `Intl` locale.
